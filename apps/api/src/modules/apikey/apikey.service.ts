import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, KeyStatus } from './entities/api-key.entity';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async listKeys(merchantId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.find({
      where: { merchantId, status: KeyStatus.ACTIVE },
      select: ['id', 'publicKey', 'status', 'expiresAt', 'createdAt'],
    });
  }

  async generateKey(merchantId: string): Promise<{ publicKey: string; secretKey: string }> {
    // Generate public key: pf_test_pub_xxxx
    const pubRandom = crypto.randomBytes(12).toString('hex');
    const publicKey = `pf_test_pub_${pubRandom}`;

    // Generate secret key: pf_test_sec_xxxx
    const secRandom = crypto.randomBytes(24).toString('hex');
    const secretKey = `pf_test_sec_${secRandom}`;

    // Hash secret key using SHA-256 for secure DB lookup
    const secretKeyHash = this.hashSecretKey(secretKey);

    // Deactivate existing active keys for this merchant (or we keep them active and let rotation overlap)
    await this.apiKeyRepository.update(
      { merchantId, status: KeyStatus.ACTIVE },
      { status: KeyStatus.REVOKED },
    );

    const apiKey = new ApiKey();
    apiKey.merchantId = merchantId;
    apiKey.publicKey = publicKey;
    apiKey.secretKeyHash = secretKeyHash;
    apiKey.status = KeyStatus.ACTIVE;

    await this.apiKeyRepository.save(apiKey);

    return {
      publicKey,
      secretKey,
    };
  }

  async validateSecretKey(secretKey: string): Promise<string> {
    const hash = this.hashSecretKey(secretKey);
    const keyRecord = await this.apiKeyRepository.findOne({
      where: { secretKeyHash: hash, status: KeyStatus.ACTIVE },
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid or revoked API key');
    }

    return keyRecord.merchantId;
  }

  private hashSecretKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
