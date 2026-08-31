import { Module, OnModuleInit, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRef } from '@nestjs/core';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

// Entities
import { User } from './modules/auth/entities/user.entity';
import { Merchant } from './modules/merchant/entities/merchant.entity';
import { ApiKey } from './modules/apikey/entities/api-key.entity';
import { PaymentIntent } from './modules/payment/entities/payment-intent.entity';
import { LedgerAccount } from './modules/ledger/entities/ledger-account.entity';
import { LedgerTransaction } from './modules/ledger/entities/ledger-transaction.entity';
import { LedgerEntry } from './modules/ledger/entities/ledger-entry.entity';
import { Refund } from './modules/refund/entities/refund.entity';
import { WebhookEndpoint } from './modules/webhook/entities/webhook-endpoint.entity';
import { WebhookLog } from './modules/webhook/entities/webhook-log.entity';
import { AuditLog } from './modules/audit/entities/audit-log.entity';

// Modules
import { RedisModule } from './modules/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { MerchantModule } from './modules/merchant/merchant.module';
import { ApiKeyModule } from './modules/apikey/apikey.module';
import { PaymentModule } from './modules/payment/payment.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { RefundModule } from './modules/refund/refund.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'root'),
        database: configService.get<string>('DB_NAME', 'payflowx'),
        entities: [
          User,
          Merchant,
          ApiKey,
          PaymentIntent,
          LedgerAccount,
          LedgerTransaction,
          LedgerEntry,
          Refund,
          WebhookEndpoint,
          WebhookLog,
          AuditLog,
        ],
        synchronize: true, // Auto migration for developer convenience
      }),
    }),
    RedisModule,
    AuthModule,
    MerchantModule,
    ApiKeyModule,
    PaymentModule,
    LedgerModule,
    RefundModule,
    WebhookModule,
    AuditModule,
    NotificationModule,
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(private moduleRef: ModuleRef) {}

  onModuleInit() {
    // Expose ModuleRef globally so dynamic service discovery works
    // without introducing circular imports in our modular monolith contexts
    (global as any).nestAppModuleRef = this.moduleRef;
  }

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
