# Forge API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

Forge API supports two authentication methods:

### 1. JWT Bearer Token

Obtained via the login endpoint. Include in requests as:

```
Authorization: Bearer <token>
```

### 2. API Key

Generated from the dashboard. Include in requests as:

```
X-API-Key: forge_<key>
```

API keys are suitable for server-to-server integrations. JWT tokens are used by the dashboard.

---

## Endpoints

### POST /auth/register

Create a new account.

**Request:**
```json
{
  "email": "developer@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "email": "developer@example.com"
}
```

### POST /auth/login

Authenticate and receive a JWT.

**Request:**
```json
{
  "email": "developer@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "email": "developer@example.com"
}
```

### POST /apikeys/create

Generate a new API key. Requires JWT.

**Response (200):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "key": "forge_a1b2c3d4e5f6...",
  "createdAt": "2026-03-10T12:00:00Z",
  "isRevoked": false
}
```

### GET /apikeys

List all your API keys. Requires JWT.

**Response (200):**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "key": "forge_a1b2c3d4e5f6...",
    "createdAt": "2026-03-10T12:00:00Z",
    "isRevoked": false
  }
]
```

### DELETE /apikeys/{id}

Revoke an API key. Requires JWT.

**Response (204):** No content.

### GET /transactions

List all transactions. Requires JWT or API Key.

**Response (200):**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "amount": 150.00,
    "currency": "USD",
    "status": "completed",
    "createdAt": "2026-03-10T12:00:00Z"
  }
]
```

### POST /payouts

Create a payout request. Requires JWT.

**Request:**
```json
{
  "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccount": "US1234567890"
}
```

**Response (200):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "bankAccount": "US1234567890",
  "status": "pending",
  "processedAt": null
}
```

### GET /payouts

List all payouts. Requires JWT.

**Response (200):**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "transactionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "bankAccount": "US1234567890",
    "status": "completed",
    "processedAt": "2026-03-10T14:00:00Z"
  }
]
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Description of what went wrong"
}
```

| Status Code | Meaning              |
|-------------|----------------------|
| 400         | Bad request          |
| 401         | Unauthorized         |
| 404         | Resource not found   |
| 500         | Internal server error|
