import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { ApiKeyService } from './apikey.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('keys')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeyController {
  constructor(private apiKeyService: ApiKeyService) {}

  @Get()
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async listKeys(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.apiKeyService.listKeys(merchantId);
  }

  @Post('rotate')
  @Roles(UserRole.MERCHANT_OWNER)
  async rotateKey(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.apiKeyService.generateKey(merchantId);
  }
}
