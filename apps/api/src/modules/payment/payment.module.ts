import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentIntent } from './entities/payment-intent.entity';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { ApiKeyModule } from '../apikey/apikey.module';
import { LedgerModule } from '../ledger/ledger.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentIntent]),
    ApiKeyModule,
    LedgerModule,
    forwardRef(() => AuthModule),
  ],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService, TypeOrmModule],
})
export class PaymentModule {}
