# Security Guide - PayFlowX

This document outlines the security architecture and defensive controls built into the PayFlowX platform.

---

## 1. Authentication & Session Security

### JWT Structure and Signature
- PayFlowX utilizes high-entropy JWTs signed using the `HS256` HMAC algorithm.
- Access tokens expire after 15 minutes to reduce the exploit window if compromised.
- Refresh tokens are rotation-enabled (each use invalidates the old token and issues a new one).

### Secure Cookies
- Refresh tokens are stored strictly in browser cookies with:
  - `HttpOnly`: Blocking client-side JavaScript access (mitigating XSS).
  - `Secure`: Transmitting only over encrypted HTTPS links.
  - `SameSite=Strict`: Protecting against Cross-Site Request Forgery (CSRF).

### Cryptographic Hashing
- User passwords are encrypted using `bcrypt` with a work factor of 12.
- Secret API Keys are hashed using `SHA-256` before database entry; the plaintext version is never displayed again after creation.

---

## 2. Authorization Framework (RBAC)

- Handled via custom NestJS interceptors and guards.
- API endpoints are protected using `@Roles()` metadata decorators.
- Example RBAC workflow check:
  ```typescript
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.MerchantOwner)
  @Post('refund')
  async triggerRefund() { ... }
  ```

---

## 3. Network & Transport Layer Security

### CORS Configuration
Cross-Origin Resource Sharing is locked down to explicit whitelists. The default development CORS configuration:
```typescript
app.enableCors({
  origin: ['http://localhost:4200'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});
```

### Rate Limiting
- Handled at the gateway level using a Redis sliding window.
- Unauthenticated endpoints: Max 20 requests/minute per IP address.
- Authenticated Merchant API endpoints: Max 100 requests/minute per API key.

---

## 4. OWASP Top 10 Mitigations

| Vulnerability | Mitigation Strategy |
| :--- | :--- |
| **A01: Broken Access Control** | Enforced RBAC guards globally; database queries verify `merchant_id` ownership scopes. |
| **A02: Cryptographic Failures** | Argon2/Bcrypt password hashing, SHA-256 for secret keys, and mandatory HTTPS protocols. |
| **A03: Injection** | Direct parameterized queries through TypeORM; strict NestJS validation pipes (`class-validator`) to clean input objects. |
| **A07: Identification and Authentication Failures** | Strict JWT validation, short lifetimes, and token rotation blacklists. |
| **A08: Software and Data Integrity Failures** | Webhook payloads are signed using HMAC-SHA256 signatures (`payflowx-signature`) to verify payload sender identity. |
