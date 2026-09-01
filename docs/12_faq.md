# FAQ Guide - PayFlowX

This document contains architectural FAQs across all domains of PayFlowX, pairing practical implementation details with strategic system design interview responses.

---

## 1. Authentication & Session Security

### Q: Why do we use Refresh Token Rotation instead of a simple static refresh token?
- **Practical Answer:** If a hacker steals a refresh token, they can indefinitely generate new access tokens. By rotating the refresh token with each request, the backend detects if an old token is reused. If reuse is detected, the entire session tree is immediately invalidated, locking out the attacker.
- **Interview Answer:** *"In PayFlowX, I implemented Refresh Token Rotation (RTR). Every time the client requests a new Access Token using their Refresh Token, the API invalidates the used Refresh Token, blacklists its JTI in Redis, and issues a new pair. If a token is stolen and reused, the backend detects the duplicate usage of the invalidated token, invalidates the entire token family, and forces re-authentication, mitigating session hijack vectors."*

---

## 2. Double-Entry Accounting Ledger

### Q: Why not store the merchant balance as a single column and update it?
- **Practical Answer:** Writing `UPDATE merchants SET balance = balance + 10` is simple, but it creates a concurrency bottleneck (row-level locks) and does not preserve the source of funds (auditing). If a discrepancy occurs, there is no way to trace where the balance went wrong.
- **Interview Answer:** *"A single balance column fails financial audits because it does not record how money moved. In PayFlowX, I built a double-entry ledger. Balances are derived from immutable entries. Every financial event creates at least two balancing entries (a credit and a debit). This prevents race conditions under high concurrent payments, provides a complete audit log, and makes reconciliation straightforward."*

---

## 3. Webhooks

### Q: Why do we sign webhooks using HMAC instead of HTTPS alone?
- **Practical Answer:** HTTPS encrypts the connection between PayFlowX and the merchant server, but it does not authenticate who sent the request. Anyone could send a POST request to the merchant's webhook endpoint claiming a payment succeeded.
- **Interview Answer:** *"We use HMAC-SHA256 signatures to verify authenticity and integrity. PayFlowX hashes the webhook body using a shared secret and sends it in the `payflowx-signature` header along with a timestamp to prevent replay attacks. The merchant server reconstructs the signature using their local secret. If the signatures match, it guarantees the payload came from PayFlowX and was not altered in transit."*

---

## 4. Angular Architecture

### Q: Why use NgRx Signal Store instead of classic NgRx or service-with-a-subject?
- **Practical Answer:** Classic NgRx requires actions, reducers, selectors, and effects which increases boilerplate. A plain service-with-a-subject works but lacks structured lifecycle hooks and state tracking. NgRx Signal Store combines the simplicity of Services with structured state extensions, selectors, and declarative side effects.
- **Interview Answer:** *"NgRx Signal Store leverages Angular's native Signals engine for fine-grained reactivity. It provides reactive state tracking without the boilerplates of classic state containers. I use it in PayFlowX to manage dashboard metrics and API key lifecycles because it automatically track dependencies and triggers UI updates only when specific signal values change, optimizing performance."*
