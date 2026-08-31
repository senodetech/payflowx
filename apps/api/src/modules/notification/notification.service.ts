import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[Notification Engine] Outgoing Email to: <${to}>`);
    this.logger.log(`[Subject] ${subject}`);
    this.logger.log(`[Body] ${body}`);
  }

  async sendSystemAlert(alertMessage: string): Promise<void> {
    this.logger.warn(`[SYSTEM ALERT] ${alertMessage}`);
  }
}
