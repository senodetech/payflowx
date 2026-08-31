import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeyService } from './apikey.service';
import { ApiKeyController } from './apikey.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApiKey]),
    forwardRef(() => AuthModule),
  ],
  providers: [ApiKeyService],
  controllers: [ApiKeyController],
  exports: [ApiKeyService, TypeOrmModule],
})
export class ApiKeyModule {}
