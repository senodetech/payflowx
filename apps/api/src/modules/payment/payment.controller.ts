import { Controller, Post, Get, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // Create payment - Programmatic secret key path
  @Post()
  @UseGuards(ApiKeyAuthGuard)
  async createPayment(@Req() req: any, @Body() body: any) {
    const merchantId = req.merchantId;
    const intent = await this.paymentService.createIntent(merchantId, body);
    
    // Auto confirm if payment method (card details) is provided in body
    if (body.paymentMethod?.card) {
      return this.paymentService.confirmIntent(intent.id, merchantId);
    }
    return intent;
  }

  // Confirm payment - Programmatic secret key path
  @Post(':id/confirm')
  @UseGuards(ApiKeyAuthGuard)
  async confirmPayment(@Param('id') id: string, @Req() req: any) {
    const merchantId = req.merchantId;
    return this.paymentService.confirmIntent(id, merchantId);
  }

  // Get single payment intent - dashboard JWT path
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async getPaymentDetails(@Param('id') id: string, @Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.paymentService.getDetails(id, merchantId);
  }

  // List payments - dashboard JWT path
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async getPaymentHistory(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.paymentService.getHistory(merchantId);
  }
}
