import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('ledger')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LedgerController {
  constructor(private ledgerService: LedgerService) {}

  @Get('balances')
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async getBalances(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.ledgerService.getBalances(merchantId);
  }

  @Get('transactions')
  @Roles(UserRole.MERCHANT_OWNER, UserRole.MERCHANT_USER)
  async getTransactionHistory(@Req() req: any) {
    const merchantId = req.user.merchantId;
    return this.ledgerService.getTransactionHistory(merchantId);
  }
}
