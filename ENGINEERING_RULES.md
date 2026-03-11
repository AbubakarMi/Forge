# Forge APIs — Engineering Rules

## Purpose

This document defines the engineering standards, architecture rules, and development guidelines for the Forge APIs project.

All contributors and AI agents working on this repository must follow these rules to ensure the codebase remains clean, scalable, and maintainable.

Forge is being built as a financial infrastructure platform, so reliability and clarity are more important than complexity.

---

# 1. Core Engineering Philosophy

The Forge codebase must prioritize:

* Simplicity
* Readability
* Reliability
* Maintainability
* Scalability

Avoid unnecessary complexity, over-engineering, or premature optimization.

The MVP should focus on solving the core problem: **reliable bulk payment processing with bank normalization.**

---

# 2. Architecture Principles

The system follows a **simple layered architecture**.

Main layers:

Frontend
Backend API
AI Normalization Service
Database

Each layer has a clear responsibility.

Frontend should not contain business logic.

Backend handles core platform logic.

AI service handles bank normalization and similarity matching.

Database is responsible for persistence.

---

# 3. Repository Structure

The project uses a **monorepo structure**.

Example structure:

```
forgeapis/

frontend/
    app/
    components/
    pages/
    services/
    styles/

backend/
    src/
        Controllers/
        Services/
        Models/
        DTOs/
        Repositories/
        Jobs/
        Infrastructure/

ai-service/
    models/
    training/
    normalization/

docs/
    PROJECT_CONTEXT.md
    ENGINEERING_RULES.md
```

Each part of the system must remain clearly separated.

---

# 4. Backend Rules

Backend is built with **ASP.NET Core**.

Guidelines:

Controllers must remain thin.

Controllers should only handle:

* request validation
* routing
* response formatting

All business logic must live in **Services**.

Database access must go through **Repositories**.

DTOs must be used for API responses.

Do not expose database entities directly to the API.

---

# 5. Database Guidelines

Primary database: **PostgreSQL**

Key principles:

Use clear table naming.

Tables must represent real business entities.

Important entities include:

Users
Organizations
API Keys
Banks
Bank Aliases
Payout Batches
Transactions

Every payout batch should generate multiple transaction records.

Transactions must contain status fields such as:

Pending
Processing
Completed
Failed

---

# 6. AI Normalization Service Rules

The AI service handles **bank name normalization**.

Responsibilities include:

Detect bank names from messy inputs.

Example inputs:

UBA
UBA PLC
United Bnk Afr

Output:

United Bank for Africa

The AI system will use:

* sentence embeddings
* similarity search
* bank registry dataset

The AI service should expose a simple API endpoint:

```
POST /normalize-bank
```

Input:

```
{
  "bank_name": "UBA PLC"
}
```

Output:

```
{
  "normalized_bank": "United Bank for Africa",
  "confidence": 0.94
}
```

---

# 7. Bulk Payment Processing Rules

Bulk uploads must follow a clear processing pipeline.

Processing steps:

1. User uploads CSV
2. System parses the file
3. Bank names are normalized
4. Records are validated
5. A payout batch is created
6. Individual transactions are generated
7. Transactions are queued for processing
8. Status updates are stored

The system must support large uploads safely.

Bulk processing should use background jobs where possible.

---

# 8. Code Quality Standards

All code must be:

Readable
Consistent
Well structured

Naming rules:

Use clear names.

Avoid abbreviations.

Example:

Bad:

```
procTxn()
```

Good:

```
ProcessTransaction()
```

Comments should explain **why something exists**, not what the code obviously does.

---

# 9. API Design Principles

Forge APIs must be **developer friendly**.

Endpoints should follow REST conventions.

Examples:

```
POST /payout-batches
GET /payout-batches
GET /transactions
POST /api-keys
```

Responses must be predictable.

Always return clear error messages.

---

# 10. Security Principles

Because Forge handles financial data, security is critical.

Important practices:

Never expose sensitive data in logs.

API keys must be hashed.

Authentication must protect all organization data.

Transactions must be auditable.

---

# 11. MVP Feature Focus

The MVP should only focus on the core system.

Priority features:

Bulk payment upload
Bank normalization
Transaction engine
Payout batch tracking
Developer API
Dashboard monitoring

Avoid building advanced features too early.

---

# 12. AI Agent Development Rules

AI agents working on this repository must:

Read `PROJECT_CONTEXT.md` before starting work.

Follow the architecture defined in this document.

Avoid creating unnecessary abstractions.

Do not restructure the project without clear justification.

Focus on incremental improvements and clear code.

---

# 13. Long-Term Engineering Direction

The system should evolve toward:

Event-driven processing
Scalable job workers
Global payment integrations
Multi-country banking support
High reliability financial infrastructure

But these should be introduced only after the MVP is stable.

---

# Final Principle

Forge should be built as **financial infrastructure that developers trust**.

Every decision should prioritize:

Reliability
Clarity
Predictability
Developer experience
