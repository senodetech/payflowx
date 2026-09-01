import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepository: Repository<AuditLog>,
  ) {}

  async log(payload: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    payload?: any;
    ipAddress?: string;
  }): Promise<AuditLog> {
    const audit = this.auditRepository.create(payload);
    return this.auditRepository.save(audit);
  }

  async getLogs(): Promise<AuditLog[]> {
    return this.auditRepository.find({ order: { createdAt: 'DESC' } });
  }
}
