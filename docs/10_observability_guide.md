# Observability Guide - PayFlowX

This document outlines the tracing, logging, and metrics monitoring infrastructure of the PayFlowX platform.

---

## 1. OpenTelemetry Trace Instrumentation

PayFlowX uses OpenTelemetry (OTel) to trace request pathways across controllers, services, database TypeORM calls, and outbound payment gateway HTTP requests.

### Initialization Setup (`src/otel-sdk.ts`)
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
});

export const otelSDK = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});
```

---

## 2. Core Prometheus System Metrics

The API exposes a Prometheus metrics endpoint at `/metrics`. We track these key performance indicators (KPIs):

### 1. Payment Metrics
- `payment_intent_created_total`: Counter, tracks volume of initiated payments.
- `payment_intent_success_total`: Counter, tracks processed payments.
- `payment_processing_latency_seconds`: Histogram, records end-to-end processing speeds.

### 2. Ledger Metrics
- `ledger_balance_check_failures_total`: Counter, tracks balance inconsistencies during checks.
- `ledger_transaction_write_latency_seconds`: Histogram, tracks DB transaction execution speed.

### 3. Webhook Metrics
- `webhook_delivery_attempts_total`: Counter (labeled with status: `success`, `failure`, `retry`).
- `webhook_delivery_latency_seconds`: Histogram.

---

## 3. Log Aggregation and Correlation

We use structured JSON logging. Every incoming API request generates a unique `x-correlation-id` header (or creates one). This correlation ID is passed to every nested call, TypeORM logs, and outbound events.

### Log Signature Example
```json
{
  "timestamp": "2026-08-29T08:50:00.123Z",
  "level": "INFO",
  "correlationId": "c90a-4fb2-8d7e-128a38bd23fa",
  "message": "PaymentIntent capture requested",
  "paymentIntentId": "pi_8a7d6e..."
}
```
If a customer claims a payment was captured but their balance is unadjusted, developers can grep for the `correlationId` to trace the execution from the HTTP route to the ledger commits.
