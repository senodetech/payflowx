# Troubleshooting Guide - PayFlowX

This document provides playbooks for identifying and resolving common run-time issues within PayFlowX.

---

## 1. Database Lock Contention (Ledger Concurrency)

### Symptoms
- Payment intents remain stuck in the `PROCESSING` state.
- API logs show PostgreSQL query timeouts: `error: remaining connection slots are reserved...` or `QueryFailedError: deadlock detected`.

### Root Cause
- Concurrent payment captures on the same merchant ledger account create write lock contentions. Because double-entry ledgers require acquiring write locks on `ledger_accounts` to recalculate current balances, high-frequency transactions block one another.

### Resolution
1. **Optimize Isolation Level:** In your database connection module, ensure that read-only balance checks do not hold serializable lock queries unnecessarily.
2. **Batching:** Queue ledger updates into background processes rather than blocking the critical path of the credit card gateway transaction.
3. **Inspect Active Locks:** Run this SQL query to identify blocking queries:
   ```sql
   SELECT pid, query, state, age(clock_timestamp(), query_start) 
   FROM pg_stat_activity 
   WHERE state != 'idle' AND age(clock_timestamp(), query_start) > interval '5 seconds';
   ```

---

## 2. Redis/Memurai Service Outages

### Symptoms
- Auth endpoints fail with `Redis connection lost` or HTTP 500 errors during login/logout.
- API rate limiter blocks all incoming traffic or permits unrestricted access.

### Diagnostic Steps
1. Run a health check in terminal:
   ```powershell
   memurai-cli ping
   ```
2. If this fails, verify if the Windows Service is running:
   ```powershell
   Get-Service -Name Memurai
   ```

### Resolution
- If service is stopped, start it in an administrator PowerShell:
   ```powershell
   Start-Service -Name Memurai
   ```
- Adjust rate-limiting service configuration to fall back to in-memory cache if Redis ping tests fail.

---

## 3. Webhook Delivery Failures

### Symptoms
- Webhooks are registered but merchant servers do not show incoming payloads.
- The webhook logs table in PayFlowX shows delivery attempts with status `FAILED` and error codes `5xx` or `TIMEOUT`.

### Resolution Steps
1. **Network Route Verification:** Ensure the merchant destination URL is publicly accessible and not blocked by the gateway firewall.
2. **Signature Mismatches:** If the merchant server rejects the payload with HTTP 401/403, verify if the webhook secret key matches:
   - Ensure the merchant is verifying signatures using the raw HTTP request body string. (Using parsed JSON objects will modify formatting/whitespace, causing signature mismatches).
3. **Queue Clearance:** Check if the background Bull/Redis queue has accumulated dead letters. Clear the queue or execute manual retries via the Admin API.
