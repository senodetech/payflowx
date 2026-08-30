# Architecture Decision Records (ADRs) - PayFlowX

This document lists the architectural decision records that drive the system design of the PayFlowX platform.

---

## ADR 1: Selection of Modular Monolith Architecture

### Status
Accepted

### Context
When building a payment processing platform, we need to balance velocity, domain clarity, and operating overhead. A common mistake is starting with a microservices architecture, which introduces substantial network overhead, distributed transaction complexities (e.g., Sagas), and operational costs before the business model is validated.

### Decision
We will build PayFlowX as a **Modular Monolith** using NestJS. Modules will have clear logical boundaries, separate databases or schema namespaces, and will communicate via programmatic dependency injection interfaces. 

### Consequences
- **Pros:** Simplified deployment, zero network serialization lag for cross-module queries, easy local debugging, unified transactional bounds.
- **Cons:** If modular boundaries are not strictly enforced, the codebase can degrade into a "spaghetti monolith." We will mitigate this using strict ESLint rules and dependency injection structures.

---

## ADR 2: Double-Entry Bookkeeping and PostgreSQL Database

### Status
Accepted

### Context
Fintech applications require 100% financial consistency. Modifying account balances directly using SQL UPDATE statements (e.g., `balance = balance + amount`) leads to race conditions, concurrency issues, and loss of historical audit trails.

### Decision
We will enforce **double-entry bookkeeping** rules in the ledger module using PostgreSQL. 
1. Balances are calculated by summing up historical debit and credit entries, rather than direct overwrites.
2. Every transaction must consist of at least one Debit and one Credit entry, and the sum of debits must equal the sum of credits.
3. PostgreSQL is chosen because of its strict ACID compliance, support for `SERIALIZABLE` transaction isolation levels to prevent race conditions during concurrent payments, and native high-precision decimal operations (`NUMERIC` data type).

### Consequences
- **Pros:** Guarantees audit compliance, prevents financial loss, and simplifies debugging of ledger states.
- **Cons:** High write volume to the ledger entry table. We mitigate this by indexing heavily and introducing cached read-only balances in Redis.

---

## ADR 3: Redis for Rate Limiting and Token Blacklisting

### Status
Accepted

### Context
Security requirements state that we must support high-performance rate limiting to mitigate DDoS / brute force login attacks. Furthermore, secure logout requires invalidating JWT refresh tokens before they naturally expire.

### Decision
We will integrate Redis (specifically the Windows native Memurai service for local dev). 
1. **Rate Limiting:** A sliding-window algorithm implemented in a NestJS interceptor using Redis transactions.
2. **Token Blacklist:** When logout is invoked, the refresh token JTI is written to Redis with a TTL matching the token's remaining lifespan. Active requests checking the JTI in Redis are rejected.

### Consequences
- **Pros:** Low-latency caching, fast invalidation, and minimal load on PostgreSQL.
- **Cons:** Redis becomes a critical runtime dependency. If Redis is unavailable, rate-limiting and logout check fallbacks must degrade gracefully to prevent platform outages.

---

## ADR 4: Angular Signals & NgRx Signal Store for State Management

### Status
Accepted

### Context
Modern Angular projects (v18+) benefit from fine-grained reactivity. Standard RxJS-heavy state management libraries (like classic NgRx Store) contain excessive boilerplate (Actions, Reducers, Selectors, Effects) that can slow down feature development.

### Decision
We will use **Angular Signals** for local UI state and the new **NgRx Signal Store** for global application and feature state.

### Consequences
- **Pros:** Boilerplate is reduced by up to 60%. Highly readable, reactive tracking of API keys, webhooks, and dashboard metrics. Built-in hooks for asynchronous state transformations.
- **Cons:** Engineers must learn the Signal Store syntax and manage the interop between RxJS streams (e.g., HTTP clients) and Signals. We will document RxJS-to-Signal patterns in the local code guidelines.
