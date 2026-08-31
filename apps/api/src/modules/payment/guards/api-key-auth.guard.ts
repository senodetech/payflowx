import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from '../../apikey/apikey.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const secretKey = this.extractSecretKey(request);

    if (!secretKey) {
      throw new UnauthorizedException('API key is missing from authorization header');
    }

    try {
      const merchantId = await this.apiKeyService.validateSecretKey(secretKey);
      request['merchantId'] = merchantId;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or revoked API secret key');
    }
  }

  private extractSecretKey(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;
    const [type, key] = authHeader.split(' ');
    return type === 'Bearer' ? key : authHeader; // Allow raw key or Bearer token format
  }
}
