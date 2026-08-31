import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { RefundService } from './refund.service';
import { ApiKeyAuthGuard } from '../payment/guards/api-key-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('refunds')
export class RefundController {
  constructor(private refundService: RefundService) {}

  // Create refund - programmatically via API Secret Key
  @Post()
  @UseGuards(ApiKeyAuthGuard)
  async createRefund(@Req() req: any, @Body() body: any) {
    const merchantId = req.merchantId;
    return this.refundService.createRefund(merchantId, body);
  }

  // Get refund history - dashboard path
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async getRefundHistory(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.refundService.getHistory(merchantId);
  }
}
