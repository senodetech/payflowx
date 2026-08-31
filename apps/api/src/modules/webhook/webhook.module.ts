import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEndpoint } from './entities/webhook-endpoint.entity';
import { WebhookLog } from './entities/webhook-log.entity';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEndpoint, WebhookLog]),
    forwardRef(() => AuthModule),
  ],
  providers: [WebhookService],
  controllers: [WebhookController],
  exports: [WebhookService, TypeOrmModule],
})
export class WebhookModule {}
