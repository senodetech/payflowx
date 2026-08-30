# Learning & Interview Guide - PayFlowX

This document breaks down the core fintech architecture concepts implemented in PayFlowX, maps them to solutions used by Stripe, Adyen, and Razorpay, and outlines how to leverage this codebase to ace Senior Engineer, Staff Engineer, and FinTech Architect interviews.

---

## 1. Double-Entry Accounting Ledger Module

### The Problem
If a payment system writes a payment status as `succeeded` but fails to update the database record of the merchant's balance due to a network glitch, money "disappears" or becomes double-counted. In high-volume systems, simple database updates are prone to race conditions and audit failure.

### How Stripe & Razorpay Solve It
- Stripe utilizes a multi-currency ledger engine that records every money movement as immutable rows in a ledger. They never update a single "balance" column directly in transactions; balances are computed streams or projections.
- Transactions are mapped to distinct accounts (e.g., pending balances, payout accounts).

### Why Recruiters Care
- Demonstrates that the engineer understands financial consistency, audit trails, and transactional integrity, avoiding floating-point rounding errors and database concurrency race conditions.

### Typical Interview Questions
- *How do you prevent race conditions when two customers pay a merchant concurrently and update their balance?*
- *How do you design a ledger that satisfies financial auditing requirements?*

### Job Interview Pitch
> "In PayFlowX, I implemented a strict double-entry ledger module. Instead of performing updates to a single balance field, every transaction writes an immutable set of debit and credit entries inside a single SQL transaction using a PostgreSQL `SERIALIZABLE` or `READ COMMITTED` isolation level. This guarantees that total debits always equal total credits, providing a clear financial trail similar to Stripe's ledger infrastructure. This architecture prevents balance inflation and race conditions under concurrent requests."

---

## 2. The `PaymentIntent` Workflow

### The Problem
In early payment APIs, charges were created in a single call. However, with the rise of modern authentication protocols like 3D Secure (3DS) and regional compliance (PSD2 in Europe), payment processing requires multi-step flows: initiating a payment, performing authentication, and then capturing the funds.

### How Stripe & Adyen Solve It
- Stripe introduced the `PaymentIntent` API. It separates the intent to pay (`create`) from the authorization (`confirm/authorize`) and final settlement (`capture`).
- If 3DS is required, the intent transitions to `requires_action` rather than completing immediately.

### Why Recruiters Care
- Confirms the candidate is familiar with real-world payment standards, compliance challenges (PSD2, SCA), and decoupled transaction lifecycles.

### Typical Interview Questions
- *Describe the difference between authorization and capture in a card payment.*
- *How do you handle payments that require two-factor customer authentication (3DS) asynchronously?*

---

## 3. Webhook Delivery and HMAC Signatures

### The Problem
Because webhooks are HTTP POST calls sent over the public internet, a bad actor can spoof requests to a merchant's server (e.g., claiming a payment succeeded without paying). Additionally, network failures can cause webhooks to drop, leading to out-of-sync application states.

### How Stripe & Razorpay Solve It
- They sign every webhook payload using a shared secret and send it in the header (`stripe-signature`).
- They use an exponential backoff schedule to retry failed webhooks over a 72-hour period.

### Typical Interview Questions
- *How do you secure webhooks to ensure payloads are authentic and untampered?*
- *How do you handle webhook delivery failures without blocking main payment processing?*

### Job Interview Pitch
> "In PayFlowX, I designed a webhook delivery engine that signs every payload with an HMAC-SHA256 signature using a shared webhook secret. To ensure reliability under network drops, I decoupled the webhook dispatch using a Redis queue. Failed deliveries are captured and retried on an exponential backoff schedule. This guarantees event delivery while protecting merchant endpoints from payload spoofing."
