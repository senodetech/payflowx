# Functional Specification - PayFlowX

This document translates the requirements from the Product Requirement Document (PRD) into concrete functional behaviors, validation rules, and error states for each of the 10 modules of PayFlowX.

---

## 1. Authentication Module

### Email Registration
- **Fields:** Email (unique, validated), Password (min 8 chars, 1 uppercase, 1 special char, 1 number), Confirm Password, Merchant Name.
- **Workflow:** User submits form -> Backend validates and hashes password -> Creates inactive User and Merchant records -> Sends verification email.

### Login / Session Setup
- **Fields:** Email, Password.
- **Outcome:** On success, returns standard JSON payload containing:
  - `accessToken` (JWT in response body, short-lived: 15 mins).
  - `refreshToken` (JWT set in HttpOnly, Secure, SameSite=Strict cookie, long-lived: 7 days).

### Logout
- **Mechanism:** Invalidates the current session by writing the JTI (JWT ID) of the refresh token to the Redis Blacklist (TTL matches remaining token expiry). Clears the client-side cookies.

---

## 2. Authorization Module (RBAC)

The system enforces three primary roles:
1. **Admin:** Full read/write access to all merchants, system configurations, manual approvals, and system metrics.
2. **Merchant Owner:** Full access to their own merchant account. Can generate API keys, configure webhooks, add users, and view processing dashboards.
3. **Merchant User:** Read-only access to transactions, refunds, and ledgers. Cannot roll API keys or modify webhooks.

---

## 3. Merchant Module

### Onboarding
- Upon registration, the merchant account status defaults to `PENDING_VERIFICATION`.
- An Admin must log into the Admin portal and mark the merchant as `ACTIVE` before payment processing is allowed.

---

## 4. API Key Module

### Key Types
- **Public Key:** Prefix `pf_test_pub_...` or `pf_live_pub_...` (Safe to expose in frontend elements).
- **Secret Key:** Prefix `pf_test_sec_...` or `pf_live_sec_...` (Must NEVER be exposed to clients; must be sent in authorization headers as a Bearer token).

### Key Lifecycle
- Merchants can roll their secret keys.
- **Grace Period:** During rotation, the old key remains active for 24 hours to prevent production API failures.

---

## 5. Payment Module

### PaymentIntent State Machine
The core payment flows follow the PaymentIntent lifecycle:
- `REQUIRES_PAYMENT_METHOD` -> Initial state.
- `REQUIRES_CONFIRMATION` -> Card details collected, ready to authorize.
- `PROCESSING` -> Contacting simulated payment gateway.
- `REQUIRES_CAPTURE` -> Payment authorized. Funds locked in gateway.
- `SUCCEEDED` -> Capture complete. Funds transferred to ledger.
- `CANCELED` -> Authorization voided or payment aborted.
- `FAILED` -> Gateway declined payment.

---

## 6. Ledger Module (Double-Entry Accounting)

To guarantee financial integrity, every financial transaction must create balanced credit and debit ledger entries. The total sum of debits must equal the total sum of credits for any transaction.

### Account Structure
Each Merchant has three linked internal ledger accounts:
1. **Customer Account (Asset):** Tracks funds paid by customers before clearing.
2. **Gateway Account (Receivable):** Tracks funds held at the processing gateway.
3. **Merchant Account (Revenue):** Tracks the merchant's withdrawable balance.

### Core Entry Rules
- **Payment Capture (Succeeded):**
  - **Debit:** Gateway Account (Asset increases).
  - **Credit:** Merchant Account (Revenue increases).
- **Refund Processing (Succeeded):**
  - **Debit:** Merchant Account (Revenue decreases).
  - **Credit:** Customer Account (Liability decreases/Asset return).

---

## 7. Refund Module

### Operations
- **Full Refund:** Returns the full captured transaction value to the customer. Updates PaymentIntent status to `REFUNDED`.
- **Partial Refund:** Returns a specified portion of the captured amount. Multi-partial refunds are allowed as long as the cumulative refund amount does not exceed the original captured value. PaymentIntent status transitions to `PARTIALLY_REFUNDED`.

---

## 8. Webhook Module

### Event Flow
- A payment/refund event is emitted -> Webhook worker queue picks it up.
- Enpatches POST request containing Event payload and the `payflowx-signature` header:
  `payflowx-signature: t=timestamp,v1=signature_hash`
- **Retry Policy:** On failure (non-2xx response), the engine retries up to 5 times with exponential backoff (`t = 2^retry * 15` seconds).

---

## 9. Audit Module

- Captures all write requests (`POST`, `PUT`, `DELETE`) with metadata (IP Address, User ID, Timestamp, Old State, New State).
- Log records are write-once and cannot be modified or deleted.

---

## 10. Notification Module

- Dispatches email alerts for critical events: password reset, API key rotation, or webhook failure alerts.
