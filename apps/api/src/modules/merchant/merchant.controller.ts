import { Controller, Get, Put, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MerchantController {
  constructor(private merchantService: MerchantService) {}

  @Get('profile')
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async getProfile(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.merchantService.getProfile(merchantId);
  }

  @Put('profile')
  @Roles(UserRole.MERCHANT_OWNER)
  async updateProfile(@Req() req: any, @Body() body: any) {
    const merchantId = req.user.merchantId;
    return this.merchantService.updateProfile(merchantId, body);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN)
  async approveMerchant(@Param('id') id: string) {
    return this.merchantService.approveMerchant(id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async listMerchants() {
    return this.merchantService.listMerchants();
  }
}
