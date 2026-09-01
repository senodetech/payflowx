import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  @Post('endpoints')
  @Roles(UserRole.MERCHANT_OWNER)
  async createEndpoint(@Req() req: any, @Body() body: any) {
    const merchantId = req.user.merchantId;
    return this.webhookService.createEndpoint(merchantId, body);
  }

  @Get('endpoints')
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async listEndpoints(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.webhookService.listEndpoints(merchantId);
  }

  @Get('logs')
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async listLogs(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.webhookService.listLogs(merchantId);
  }
}
