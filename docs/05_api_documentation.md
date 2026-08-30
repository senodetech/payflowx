# API Documentation - PayFlowX

All requests to PayFlowX APIs should accept and return JSON payloads.

---

## 1. Authentication Endpoints

### Register User
* **Endpoint:** `POST /api/v1/auth/register`
* **Headers:** `Content-Type: application/json`
* **Request Body:**
```json
{
  "email": "owner@acme.com",
  "password": "SecurePassword123!",
  "merchantName": "Acme Corporation"
}
```
* **Response Body (201 Created):**
```json
{
  "message": "Registration successful. Please verify your email.",
  "userId": "d290f1ee-6c54-4b01-90e6-d701748f0851"
}
```

### Login
* **Endpoint:** `POST /api/v1/auth/login`
* **Request Body:**
```json
{
  "email": "owner@acme.com",
  "password": "SecurePassword123!"
}
```
* **Response Body (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "email": "owner@acme.com",
    "role": "MERCHANT_OWNER",
    "merchantId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
  }
}
```
* *Note:* Sets an `HttpOnly`, `Secure`, `SameSite=Strict` cookie containing the `refreshToken`.

---

## 2. API Key Management Endpoints

### List API Keys
* **Endpoint:** `GET /api/v1/keys`
* **Headers:** `Authorization: Bearer <accessToken>`
* **Response (200 OK):**
```json
[
  {
    "id": "e6a576db-54a7-47b2-bd75-38b9d99723fa",
    "publicKey": "pf_test_pub_5f309aef8d...",
    "status": "ACTIVE",
    "expiresAt": null,
    "createdAt": "2026-08-29T08:00:00Z"
  }
]
```

### Create / Rotate API Key
* **Endpoint:** `POST /api/v1/keys/rotate`
* **Headers:** `Authorization: Bearer <accessToken>`
* **Response (201 Created):**
```json
{
  "id": "e6a576db-54a7-47b2-bd75-38b9d99723fa",
  "publicKey": "pf_test_pub_5f309aef8d...",
  "secretKey": "pf_test_sec_7a2b9c3f4e...",
  "status": "ACTIVE",
  "createdAt": "2026-08-29T08:00:00Z"
}
```
* **WARNING:** The `secretKey` is returned **only once** at creation. PayFlowX stores only the hashed representation (`SHA-256`) of the secret key.

---

## 3. Payment Processing Endpoints

### Create PaymentIntent
* **Endpoint:** `POST /api/v1/payments`
* **Headers:** `Authorization: Bearer <secretKey>`
* **Request Body:**
```json
{
  "amount": 4999.00,
  "currency": "USD",
  "paymentMethod": {
    "type": "card",
    "card": {
      "number": "4242424242424242",
      "expiryMonth": 12,
      "expiryYear": 2028,
      "cvc": "123"
    }
  }
}
```
* **Response (201 Created):**
```json
{
  "id": "a90df124-7b43-4c92-ad79-df3a401c4568",
  "amount": 4999.00,
  "currency": "USD",
  "status": "SUCCEEDED",
  "clientSecret": "pi_sec_908fab...",
  "createdAt": "2026-08-29T08:15:00Z"
}
```

---

## 4. Refund Endpoints

### Create Refund
* **Endpoint:** `POST /api/v1/refunds`
* **Headers:** `Authorization: Bearer <secretKey>`
* **Request Body:**
```json
{
  "paymentIntentId": "a90df124-7b43-4c92-ad79-df3a401c4568",
  "amount": 1000.00,
  "reason": "Customer request"
}
```
* **Response (201 Created):**
```json
{
  "id": "e09fa84a-9c71-460d-85fa-1209b1f09ab3",
  "paymentIntentId": "a90df124-7b43-4c92-ad79-df3a401c4568",
  "amount": 1000.00,
  "status": "SUCCEEDED",
  "createdAt": "2026-08-29T08:20:00Z"
}
```

---

## 5. Webhook Endpoints

### Create Webhook Endpoint
* **Endpoint:** `POST /api/v1/webhooks/endpoints`
* **Headers:** `Authorization: Bearer <accessToken>`
* **Request Body:**
```json
{
  "url": "https://api.merchant.com/payflowx-webhooks",
  "enabledEvents": ["payment.succeeded", "payment.failed", "refund.succeeded"]
}
```
* **Response (201 Created):**
```json
{
  "id": "c1f8a84b-01a0-4f51-b8f9-c09a8e0f1121",
  "url": "https://api.merchant.com/payflowx-webhooks",
  "secret": "whsec_7d2f9a...",
  "status": "ACTIVE",
  "enabledEvents": ["payment.succeeded", "payment.failed", "refund.succeeded"]
}
```
