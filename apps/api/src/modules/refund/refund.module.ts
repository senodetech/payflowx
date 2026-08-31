import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Refund } from './entities/refund.entity';
import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { PaymentModule } from '../payment/payment.module';
import { LedgerModule } from '../ledger/ledger.module';
import { ApiKeyModule } from '../apikey/apikey.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Refund]),
    PaymentModule,
    LedgerModule,
    ApiKeyModule,
    forwardRef(() => AuthModule),
  ],
  providers: [RefundService],
  controllers: [RefundController],
  exports: [RefundService, TypeOrmModule],
})
export class RefundModule {}
