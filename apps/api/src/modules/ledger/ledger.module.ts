import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerAccount } from './entities/ledger-account.entity';
import { LedgerTransaction } from './entities/ledger-transaction.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { LedgerService } from './ledger.service';
import { LedgerController } from './ledger.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LedgerAccount, LedgerTransaction, LedgerEntry]),
    forwardRef(() => AuthModule),
  ],
  providers: [LedgerService],
  controllers: [LedgerController],
  exports: [LedgerService, TypeOrmModule],
})
export class LedgerModule {}
