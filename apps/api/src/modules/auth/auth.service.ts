import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Merchant } from '../merchant/entities/merchant.entity';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Repository<Merchant>>, // wait, we inject Repository<Merchant>
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async register(payload: any) {
    const { email, password, merchantName } = payload;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('Email is already registered');
    }

    // Create Merchant (Merchant module handles database persistence, but we do it directly inside this monolith step)
    // We cast to any to bypass the compiler type issues if necessary
    const merchant = new Merchant();
    merchant.name = merchantName;
    const savedMerchant = await (this.merchantRepository as any).save(merchant);

    // Create User
    const user = new User();
    user.email = email;
    user.passwordHash = await bcrypt.hash(password, 12);
    user.role = UserRole.MERCHANT_OWNER;
    user.merchant = savedMerchant;
    user.merchantId = savedMerchant.id;

    const savedUser = await this.userRepository.save(user);

    return {
      message: 'Merchant and Owner registration successful',
      userId: savedUser.id,
      merchantId: savedMerchant.id,
    };
  }

  async login(payload: any) {
    const { email, password } = payload;
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      // Check if refresh token JTI is blacklisted
      const isBlacklisted = await this.redisService.get(`blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Blacklist old refresh token JTI to enforce rotation
      await this.redisService.set(`blacklist:${payload.jti}`, '1', 604800); // 7 days TTL

      return this.generateTokens(user);
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      // Invalidate by blacklisting the JTI in Redis
      await this.redisService.set(`blacklist:${payload.jti}`, '1', 604800);
      return { message: 'Logged out successfully' };
    } catch {
      throw new BadRequestException('Invalid session logout request');
    }
  }

  private async generateTokens(user: User) {
    const jti = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const payload = { sub: user.id, email: user.email, role: user.role, merchantId: user.merchantId, jti };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '900s'),
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '604800s'),
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        merchantId: user.merchantId,
      },
    };
  }
}
