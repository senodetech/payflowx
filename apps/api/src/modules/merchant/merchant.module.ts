import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Merchant } from './entities/merchant.entity';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Merchant]),
    forwardRef(() => AuthModule),
  ],
  providers: [MerchantService],
  controllers: [MerchantController],
  exports: [MerchantService, TypeOrmModule],
})
export class MerchantModule {}
