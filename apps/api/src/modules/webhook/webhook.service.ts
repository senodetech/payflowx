import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEndpoint, WebhookEndpointStatus } from './entities/webhook-endpoint.entity';
import { WebhookLog, WebhookDeliveryStatus } from './entities/webhook-log.entity';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(WebhookEndpoint)
    private endpointRepository: Repository<WebhookEndpoint>,
    @InjectRepository(WebhookLog)
    private logRepository: Repository<WebhookLog>,
  ) {}

  async createEndpoint(merchantId: string, payload: any): Promise<WebhookEndpoint> {
    const { url, enabledEvents } = payload;
    const endpoint = new WebhookEndpoint();
    endpoint.merchantId = merchantId;
    endpoint.url = url;
    endpoint.enabledEvents = enabledEvents || [];
    endpoint.secret = `whsec_${crypto.randomBytes(20).toString('hex')}`;
    endpoint.status = WebhookEndpointStatus.ACTIVE;

    return this.endpointRepository.save(endpoint);
  }

  async listEndpoints(merchantId: string): Promise<WebhookEndpoint[]> {
    return this.endpointRepository.find({ where: { merchantId } });
  }

  async listLogs(merchantId: string): Promise<WebhookLog[]> {
    const endpoints = await this.endpointRepository.find({ where: { merchantId } });
    const endpointIds = endpoints.map((e) => e.id);
    if (endpointIds.length === 0) {
      return [];
    }
    return this.logRepository.find({
      where: endpointIds.map((id) => ({ webhookEndpointId: id })),
      order: { createdAt: 'DESC' },
    });
  }

  async triggerEvent(merchantId: string, eventType: string, eventData: any): Promise<void> {
    // 1. Fetch active webhooks for the merchant listening to this event type
    const endpoints = await this.endpointRepository.find({
      where: { merchantId, status: WebhookEndpointStatus.ACTIVE },
    });

    const matchingEndpoints = endpoints.filter((e) =>
      e.enabledEvents.includes('*') || e.enabledEvents.includes(eventType),
    );

    for (const endpoint of matchingEndpoints) {
      // 2. Create initial pending log
      const log = new WebhookLog();
      log.webhookEndpointId = endpoint.id;
      log.eventType = eventType;
      log.payload = eventData;
      log.status = WebhookDeliveryStatus.PENDING;
      log.attemptNumber = 1;

      const savedLog = await this.logRepository.save(log);

      // 3. Dispatch asynchronously
      this.dispatchWebhook(endpoint, savedLog);
    }
  }

  private async dispatchWebhook(endpoint: WebhookEndpoint, log: WebhookLog): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const bodyString = JSON.stringify(log.payload);
    
    // Construct payflowx-signature header: t=timestamp,v1=signature
    const signedPayload = `${timestamp}.${bodyString}`;
    const signature = crypto
      .createHmac('sha256', endpoint.secret)
      .update(signedPayload)
      .digest('hex');
    const signatureHeader = `t=${timestamp},v1=${signature}`;

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'payflowx-signature': signatureHeader,
        },
        body: bodyString,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      const responseBody = await response.text();

      log.responseStatus = response.status;
      log.responseBody = responseBody.substring(0, 1000); // Truncate logs if too long

      if (response.ok) {
        log.status = WebhookDeliveryStatus.DELIVERED;
      } else {
        log.status = WebhookDeliveryStatus.FAILED;
        this.scheduleRetry(endpoint, log);
      }
    } catch (err) {
      log.status = WebhookDeliveryStatus.FAILED;
      log.responseStatus = 500;
      log.responseBody = err.message || 'Network connection failed';
      this.scheduleRetry(endpoint, log);
    }

    await this.logRepository.save(log);
  }

  private scheduleRetry(endpoint: WebhookEndpoint, log: WebhookLog) {
    const maxRetries = 5;
    if (log.attemptNumber >= maxRetries) {
      return; // Stop retrying
    }

    // Exponential backoff: retry after 2^attemptNumber * 10 seconds (e.g. 20s, 40s, 80s...)
    const delayMs = Math.pow(2, log.attemptNumber) * 10000;
    
    setTimeout(async () => {
      // Create a new retry log and dispatch
      const retryLog = new WebhookLog();
      retryLog.webhookEndpointId = endpoint.id;
      retryLog.eventType = log.eventType;
      retryLog.payload = log.payload;
      retryLog.status = WebhookDeliveryStatus.PENDING;
      retryLog.attemptNumber = log.attemptNumber + 1;

      const savedLog = await this.logRepository.save(retryLog);
      this.dispatchWebhook(endpoint, savedLog);
    }, delayMs);
  }
}
