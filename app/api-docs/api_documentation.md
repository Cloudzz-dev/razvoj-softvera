# DFDS.io API Documentation

Welcome to the DFDS.io API. This documentation provides a comprehensive guide to interacting with the DFDS.io platform programmatically.

## Base URL

```
https://dfds.cloudzz.dev/api
```

## Authentication

The API supports two modes of authentication depending on the endpoint type.

### 1. Session Authentication (Browser/Internal)
Most endpoints used by the frontend application require a specialized session cookie. These endpoints are marked as **Session Only**.
- **Header**: Automatically handled by browser cookies.
- **Restrictions**: Cannot be accessed using an API Key.

### 2. API Key Authentication (Developer API)
Endpoints designed for external integration support standard Bearer Token authentication. These are marked as **API Key Supported**.
- **Header**: `Authorization: Bearer <YOUR_API_KEY>`
- **Obtaining Keys**: Generate API keys in the **Settings > API Keys** section of your dashboard.

> [!WARNING]
> Do not share your API keys. If a key is compromised, revoke it immediately via the dashboard.

## Rate Limits

To ensure platform stability, rate limits are enforced on all endpoints.

| Route Type | Limit | Description |
| :--- | :--- | :--- |
| **General** | **60 req/min** | Standard limit for most GET/POST requests. |
| **Auth** | **10 req/min** | Stricter limit for login and verification endpoints. |
| **Chat** | **10 req/min** | Limit for AI-powered chat endpoints. |
| **Register** | **5 req/min** | Strict limit for account creation. |

**Response Headers:**
When you exceed the limit, the API returns `429 Too Many Requests` with:
- `Retry-After`: Number of seconds to wait before retrying.

---

## Endpoints

### Authentication & User

#### Register User
Register a new user account.

- **URL**: `/register`
- **Method**: `POST`
- **Auth**: None (Public)
- **Rate Limit**: 5 req/min

**Request Body**
```json
{
  "name": "string (required)",
  "email": "string (required, valid email)",
  "password": "string (required, min 6 chars)",
  "role": "string (required) - 'DEVELOPER', 'FOUNDER', 'INVESTOR'",
  "location": "string (optional)",
  
  // Developer Specific
  "skills": ["string"] (optional),
  "experience": "string (optional)",
  "availability": "string (optional)",
  "rate": "string (optional)",
  
  // Investor Specific
  "firm": "string (optional)",
  "checkSize": "string (optional)",
  "focus": "string (optional)",
  
  // Founder Specific
  "startupName": "string (optional)",
  "pitch": "string (optional)",
  "stage": "string (optional)",
  "websiteUrl": "string (optional)"
}
```

**Response (200 OK)**
```json
{
  "user": {
    "id": "user_123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "DEVELOPER"
  }
}
```

#### Verify Email
Verify a user's email address using a token.

- **URL**: `/verify-email`
- **Method**: `POST`
- **Auth**: None (Public)
- **Rate Limit**: 10 req/min

**Request Body**
```json
{
  "token": "string (required)"
}
```

---

### Dashboard (Session Only)

> [!NOTE]
> These endpoints are reserved for the frontend application and require an active browser session.

#### Get Statistics
Fetch user dashboard statistics.

- **URL**: `/dashboard/stats`
- **Method**: `GET`
- **Auth**: Session Only
- **Rate Limit**: 60 req/min

**Response (200 OK)**
```json
{
  "connections": 10,
  "startups": 5,
  "investors": 2,
  "growth": "+15%"
}
```

#### Get Activity Feed
Fetch recent activity for the user.

- **URL**: `/dashboard/activity`
- **Method**: `GET`
- **Auth**: Session Only
- **Rate Limit**: 60 req/min

**Response (200 OK)**
```json
[
  {
    "id": "act_123",
    "type": "message",
    "message": "New message from Alice",
    "icon": "💬",
    "createdAt": "2024-01-01T12:00:00Z"
  }
]
```

---

### Startups & Network

#### List Startups (v1)
Retrieve a list of startups. Supports filtering and pagination.

- **URL**: `/v1/startups`
- **Method**: `GET`
- **Auth**: **API Key Supported** or Session
- **Rate Limit**: 60 req/min

**Response (200 OK)**
```json
{
  "data": [
    {
      "id": "startup_123",
      "name": "Acme Corp",
      "pitch": "Building the future",
      "stage": "Seed",
      "founder": "Wile E. Coyote",
      "founderId": "user_999",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 50
  }
}
```

#### List Available Startups (Web)
Internal endpoint for browsing startups.

- **URL**: `/startups`
- **Method**: `GET`
- **Auth**: Session Only
- **Rate Limit**: 60 req/min

---

### Messaging (Session Only)

#### Send Message
Send a direct message to a user or conversation.

- **URL**: `/messages/send`
- **Method**: `POST`
- **Auth**: Session Only
- **Rate Limit**: 60 req/min

**Request Body**
```json
{
  "receiverId": "string (conditional) - Required for new chats (id of the user)",
  "conversationId": "string (conditional) - Required for existing chats",
  "content": "string (required, max 1000 chars)"
}
```

**Workflow Example: Starting a Chat**
1.  **Search Users**: Get a `userId` from `/v1/startups` or member lists.
2.  **Send**: POST to `/messages/send` with `receiverId`.
3.  **Result**: Returns a `conversationId` to use for subsequent messages.

**Error Responses**
- `400 Bad Request`: Missing content.
- `404 Not Found`: Receiver does not exist.

---

### External Metrics (API Key Supported)

#### Send Growth Metrics
Programmatically send your startup's growth metrics to your dashboard.

- **URL**: `/v1/ingest/metrics`
- **Method**: `POST`
- **Auth**: API Key
- **Rate Limit**: 60 req/min

**Request Body**
```json
{
  "metricType": "revenue", // or "active_users", "mrr", etc.
  "value": 5000,
  "date": "2023-12-25T00:00:00Z", // optional
  "metadata": { "currency": "USD" } // optional
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "metricId": "metric_123"
}
```

---

### Data Ingestion (Business Integration)

> [!TIP]
> Use these endpoints to sync data from your internal tools (HR info, Cap Table, etc.) to StartIt.

#### Sync Team Members
Bulk add or invite your employees to your startup profile.
- **URL**: `/v1/team/sync`
- **Method**: `POST`
- **Auth**: API Key (Founder Only)
- **Body**:
  ```json
  {
    "members": [
      { "email": "alice@acme.com", "role": "ADMIN" },
      { "email": "bob@acme.com", "role": "MEMBER" }
    ]
  }
  ```
**Error Responses**
- `403 Forbidden`: API Key does not belong to a Founder.

#### Update Funding
Sync your latest funding round to keep your profile fresh for investors.
- **URL**: `/v1/startup/funding`
- **Method**: `POST`
- **Auth**: API Key (Founder Only)
- **Body**:
  ```json
  {
    "totalRaised": "$5.2M",
    "stage": "Series A",
    "round": "Series A"
  }
  ```

#### Update Portfolio (Investors)
Sync your portfolio companies to showcase your track record.
- **URL**: `/v1/investor/portfolio`
- **Method**: `POST`
- **Auth**: API Key (Investor Only)
- **Body**:
  ```json
  {
    "companies": [
      { "name": "Uber", "website": "https://uber.com" },
      { "name": "Stripe" }
    ]
  }
  ```

### System

#### Health Check
Verify API availability.

- **URL**: `/health`
- **Method**: `GET`
- **Auth**: None (Public)
- **Rate Limit**: 60 req/min
- **Response**: `200 OK` with JSON status.

---

## Error Responses

The API uses standard HTTP status codes.

| Code | Description |
| :--- | :--- |
| **400** | **Bad Request**: Missing required parameters or validation failed. |
| **401** | **Unauthorized**: Invalid API key or missing session. |
| **403** | **Forbidden**: Insufficient permissions. |
| **404** | **Not Found**: Resource does not exist. |
| **429** | **Too Many Requests**: Rate limit exceeded. |
| **500** | **Internal Server Error**: Something went wrong on our end. |

**Error Body Format**
```json
{
  "error": "human_readable_error_message",
  "details": "optional_validation_details"
}
```
