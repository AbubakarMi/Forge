# Forge API

APIs powering modern financial products.

Forge API is a developer-focused financial API platform that provides payment processing, transaction management, and payout services through clean, well-documented APIs.

## Architecture

Modular monolith with a clear separation between backend API and frontend dashboard.

```
forge/
├── backend/
│   └── forge-api/          # ASP.NET Core 8 Web API
├── frontend/
│   └── forge-dashboard/    # Next.js 14 Dashboard
└── docs/                   # API documentation & guides
```

## Tech Stack

| Layer      | Technology                              |
|------------|-----------------------------------------|
| Backend    | ASP.NET Core 8, C#, Entity Framework    |
| Database   | PostgreSQL                              |
| Auth       | JWT + API Key authentication            |
| Frontend   | Next.js 14, TypeScript, TailwindCSS     |
| API Docs   | Swagger / OpenAPI                       |

## Getting Started

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 18+](https://nodejs.org/)
- [PostgreSQL 15+](https://www.postgresql.org/download/)

### Backend

```bash
cd backend/forge-api
dotnet restore
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

The API will be available at `http://localhost:5000` with Swagger UI at `http://localhost:5000/swagger`.

### Frontend

```bash
cd frontend/forge-dashboard
npm install
npm run dev
```

The dashboard will be available at `http://localhost:4000`.

### Environment Variables

**Backend** (`backend/forge-api/appsettings.json`):

| Variable                          | Description                    |
|-----------------------------------|--------------------------------|
| ConnectionStrings:DefaultConnection | PostgreSQL connection string  |
| JwtSettings:Secret                | JWT signing key (min 32 chars) |
| JwtSettings:Issuer                | Token issuer                   |
| JwtSettings:Audience              | Token audience                 |
| JwtSettings:ExpiryInMinutes       | Token TTL                      |

**Frontend** (`frontend/forge-dashboard/.env.local`):

| Variable              | Description       | Default                 |
|-----------------------|-------------------|-------------------------|
| NEXT_PUBLIC_API_URL   | Backend API URL   | http://localhost:5000   |

## API Endpoints

### Auth
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| POST   | /api/auth/register    | Register a new user  |
| POST   | /api/auth/login       | Login and get JWT    |

### API Keys
| Method | Endpoint              | Description          | Auth     |
|--------|-----------------------|----------------------|----------|
| POST   | /api/apikeys/create   | Generate a new key   | JWT      |
| GET    | /api/apikeys          | List your API keys   | JWT      |
| DELETE | /api/apikeys/{id}     | Revoke an API key    | JWT      |

### Transactions
| Method | Endpoint              | Description          | Auth         |
|--------|-----------------------|----------------------|--------------|
| GET    | /api/transactions     | List transactions    | JWT / API Key|

### Payouts
| Method | Endpoint              | Description          | Auth     |
|--------|-----------------------|----------------------|----------|
| POST   | /api/payouts          | Create a payout      | JWT      |
| GET    | /api/payouts          | List payouts         | JWT      |

## API Flow

```
1. Register     POST /api/auth/register { email, password }
2. Login        POST /api/auth/login    { email, password } → { token }
3. Create Key   POST /api/apikeys/create (Bearer token)    → { key: "forge_abc123..." }
4. Use API      GET  /api/transactions   (X-API-Key: forge_abc123...)
5. Payout       POST /api/payouts        (Bearer token)    → { id, status: "pending" }
```

## Project Structure

### Backend (`backend/forge-api/`)

```
Controllers/       → API endpoints (Auth, ApiKey, Transaction, Payout)
Services/          → Business logic layer (interfaces + implementations)
Models/            → EF Core entity models (User, ApiKey, Transaction, Payout)
DTOs/              → Request/response objects organized by domain
Data/              → DbContext and migrations
Middleware/        → Exception handling and API key authentication
Utils/             → JWT generation, password hashing
Configurations/    → Strongly-typed settings classes
```

### Frontend (`frontend/forge-dashboard/`)

```
app/               → Next.js App Router pages
  dashboard/       → Protected dashboard pages (api-keys, transactions, payouts)
  login/           → Auth pages
  register/
components/
  layout/          → Sidebar, TopBar
  ui/              → Reusable UI components (Button, Card, Input, Badge)
services/          → API client and service modules
hooks/             → Custom React hooks
types/             → TypeScript interfaces
```

## Future Roadmap

- [ ] Redis caching layer
- [ ] RabbitMQ for async payout processing
- [ ] Webhook notifications
- [ ] Rate limiting per API key
- [ ] Admin dashboard
- [ ] Multi-currency support
- [ ] Audit logging

## License

Proprietary - All rights reserved.
