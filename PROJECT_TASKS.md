# Forge APIs — Complete Project Tasks

## Purpose

This document contains every task required to build Forge APIs from its current state to a production-ready financial infrastructure platform.

Tasks are broken into small, focused sub-tasks. Each sub-task is one unit of work that can be completed independently before moving to the next.

---

# Current State

What already exists:

- Landing page (Next.js with animations)
- Login and register pages
- Basic JWT authentication (register + login)
- API key management (create, list, revoke)
- Simple transaction model (list only)
- Simple payout model (create, list)
- Dashboard with overview, transactions, payouts, and API keys pages
- Database: Users, ApiKeys, Transactions, Payouts tables
- Middleware: API key validation, global exception handler
- Frontend services: auth, apiKey, transaction, payout

---

# PHASE 1 — MVP FOUNDATION

---

## Task 1 — Database & Models Restructure

---

### Task 1.1 — Create Organization and OrganizationMember Models ✅ DONE

**Backend**

Create Models/Organization.cs:
- Id (Guid), Name (string), Email (string), Country (string), CreatedAt, UpdatedAt
- Navigation: OrganizationMembers, ApiKeys, PayoutBatches

Create Models/OrganizationMember.cs:
- Id (Guid), UserId (Guid FK), OrganizationId (Guid FK), Role (string: owner/admin/member), JoinedAt

---

### Task 1.2 — Create Bank and BankAlias Models ✅ DONE

**Backend**

Create Models/Bank.cs:
- Id (Guid), Name (string unique), Code (string unique), Country (string), IsActive (bool), CreatedAt

Create Models/BankAlias.cs:
- Id (Guid), BankId (Guid FK), Alias (string), CreatedAt

---

### Task 1.3 — Create PayoutBatch Model ✅ DONE

**Backend**

Create Models/PayoutBatch.cs:
- Id (Guid), OrganizationId (Guid FK), CreatedByUserId (Guid FK), FileName (string)
- TotalRecords (int), TotalAmount (decimal), SuccessCount (int), FailedCount (int), PendingCount (int)
- Status (string: pending/processing/completed/failed/partially_completed)
- CreatedAt, CompletedAt (nullable)

---

### Task 1.4 — Restructure Transaction Model ✅ DONE

**Backend**

Update Models/Transaction.cs to support batch processing:
- Id (Guid), PayoutBatchId (Guid FK), OrganizationId (Guid FK)
- RecipientName (string), BankId (Guid FK nullable), RawBankName (string), NormalizedBankName (string nullable)
- AccountNumber (string), Amount (decimal), Currency (string)
- Status (string: pending/validating/processing/completed/failed)
- FailureReason (string nullable), NormalizationConfidence (decimal nullable)
- RetryCount (int default 0), ProcessedAt (DateTime nullable), CreatedAt

---

### Task 1.5 — Update AppDbContext with All New Entities ✅ DONE

**Backend**

Update Data/AppDbContext.cs:
- Add DbSets: Organizations, OrganizationMembers, Banks, BankAliases, PayoutBatches
- Configure all relationships with Fluent API
- Add indexes on: Bank.Code, Bank.Name, BankAlias.Alias, Transaction.Status, Transaction.PayoutBatchId, PayoutBatch.OrganizationId
- Configure cascade delete rules
- Configure decimal precision for money fields

---

### Task 1.6 — Create and Run Database Migration ✅ DONE

**Backend**

Generate EF Core migration for the full schema restructure.

Run migration against PostgreSQL.

Verify all tables, relationships, indexes, and constraints are created.

---

### Task 1.7 — Seed Bank Registry Data ✅ DONE

**Backend**

Create Data/Seeds/BankSeeder.cs:
- Seed at least 20 Nigerian banks with codes and aliases
- Examples:
  - United Bank for Africa (033) → UBA, UBA PLC, United Bnk Afr, U.B.A
  - Guaranty Trust Bank (058) → GTB, GTBANK, GT BANK
  - First Bank of Nigeria (011) → FBN, FIRST BANK, FirstBank
  - Access Bank (044) → ACCESS, Access Bnk
  - Zenith Bank (057) → ZENITH, Zenith Bnk
- Call seeder on application startup if banks table is empty

---

### Task 1.8 — Update Frontend TypeScript Types ✅ DONE

**Frontend**

Update types/index.ts with all new types:
- Organization, OrganizationMember
- Bank, BankAlias
- PayoutBatch, PayoutBatchDetail
- TransactionDetail (updated with new fields)
- BatchValidationError
- TransactionStats
- PaginatedResponse<T>

---

## Task 2 — Standardized API Response & Error Handling

---

### Task 2.1 — Create Standard API Response Wrapper ✅ DONE

**Backend**

Create DTOs/ApiResponse.cs:
```
{ "success": true, "data": {...}, "message": "...", "errors": [] }
```

Create generic ApiResponse<T> class.

Update all existing controllers to return this format.

---

### Task 2.2 — Create Custom Exception Classes ✅ DONE

**Backend**

Create Exceptions/ directory with:
- NotFoundException
- ValidationException
- ForbiddenException
- ConflictException

Each exception carries a message and optional error details.

---

### Task 2.3 — Update Exception Middleware ✅ DONE

**Backend**

Update Middleware/ExceptionMiddleware.cs:
- NotFoundException → 404
- ValidationException → 400
- UnauthorizedException → 401
- ForbiddenException → 403
- ConflictException → 409
- General Exception → 500
- Log all exceptions with context
- Return standardized ApiResponse format

---

### Task 2.4 — Add Request Validation ✅ DONE

**Backend**

Add FluentValidation or DataAnnotations to all existing and new DTOs:
- Required fields, string lengths, email formats, positive amounts
- Return structured validation error list in ApiResponse

---

### Task 2.5 — Create Toast Notification System ✅ DONE

**Frontend**

Create components/ui/Toast.tsx — toast component for success/error/warning/info.

Create hooks/useToast.ts — hook to trigger toasts from any component.

---

### Task 2.6 — Update API Client Error Handling ✅ DONE

**Frontend**

Update services/apiClient.ts:
- Parse standardized ApiResponse format
- Show toast on API errors
- Handle 401 → redirect to login
- Handle 403 → show permission denied toast
- Handle 429 → show rate limit toast
- Handle 500 → show generic error toast

Create components/ui/FormError.tsx — reusable validation error display.

---

## Task 2B — Security Hardening (Banking-Grade)

> These tasks fix critical security gaps that exist in the current code. A banking system cannot ship without them.

---

### Task 2B.1 — Hash API Keys (Never Store Raw) ✅ DONE

**Backend**

The current `ApiKeyService` stores API keys as plaintext in the database. This is a critical vulnerability — a database breach exposes every client key.

Update `ApiKeyService.cs`:
- On key creation: generate raw key → return it to user → store only SHA-256 hash in DB
- On key lookup (`ApiKeyMiddleware`): hash the incoming key → compare against stored hash
- The raw key is shown exactly once — at creation. Never returned again.

Update `ApiKey` model:
- Rename `Key` → `KeyHash` (string)
- Add `KeyPrefix` (string, first 8 chars like `forge_ab12...` for display)
- Add `LastUsedAt` (DateTime?)

Migration: rename column, backfill is not possible — all existing keys become invalid (acceptable at this stage).

---

### Task 2B.2 — Secure API Key Responses ✅ DONE

**Backend**

Update `ApiKeyController`:
- `POST /api/apikeys` → return `{ keyPrefix, fullKey (one-time), createdAt }` — the only time `fullKey` is visible
- `GET /api/apikeys` → return `{ id, keyPrefix, createdAt, lastUsedAt, isRevoked }` — never return the key/hash

Create `DTOs/ApiKeys/`:
- `ApiKeyCreatedResponse` (id, keyPrefix, fullKey, createdAt)
- `ApiKeyListResponse` (id, keyPrefix, createdAt, lastUsedAt, isRevoked)

**Frontend**

Update API keys page:
- Show "one-time" modal on creation with copy button + warning "This key will not be shown again"
- List shows prefix only (`forge_ab12****`)

---

### Task 2B.3 — Add Refresh Token & Token Rotation ✅ DONE

**Backend**

Create `Models/RefreshToken.cs`:
- Id (Guid), UserId (Guid FK), TokenHash (string), ExpiresAt (DateTime), CreatedAt, RevokedAt (DateTime?), ReplacedByTokenId (Guid?), CreatedByIp (string)

Update `AuthService`:
- On login: generate access token (15 min) + refresh token (7 days)
- Return both tokens; refresh token set as HttpOnly cookie
- `POST /api/auth/refresh` — validate refresh token, issue new pair, revoke old
- `POST /api/auth/revoke` — revoke refresh token family (detect reuse = compromise)

Update `JwtTokenGenerator`:
- Reduce access token expiry to 15 minutes
- Add `jti` claim for token identification

Migration: add `RefreshTokens` table.

**Frontend**

Update `apiClient.ts`:
- On 401: attempt silent refresh via `/api/auth/refresh`
- If refresh fails: redirect to login
- Remove token from JS-accessible cookies — use HttpOnly

---

### Task 2B.4 — Create Audit Log System ✅ DONE

**Backend**

Create `Models/AuditLog.cs`:
- Id (long auto-increment), UserId (Guid?), OrganizationId (Guid?), Action (string: "user.login", "batch.created", "transaction.processed", "apikey.created", "apikey.revoked", "member.added"), EntityType (string), EntityId (string), IpAddress (string), UserAgent (string), Details (string JSON), CreatedAt (DateTime)

Create `Services/AuditService.cs`:
- `LogAsync(action, entityType, entityId, userId, orgId, details)` — fire-and-forget, never blocks the request
- `GetAuditLogsAsync(orgId, filters, pagination)` — query with filters

Create `Controllers/AuditController.cs`:
- `GET /api/audit-logs` — list (admin/owner only), filterable by action, user, date range

Migration: add `AuditLogs` table with indexes on `CreatedAt`, `UserId`, `OrganizationId`, `Action`.

Add audit logging calls to: AuthService (login, register), ApiKeyService (create, revoke), OrganizationService (create, update, add/remove member), PayoutBatchService (create, cancel, retry).

**Frontend**

Create `app/dashboard/audit-log/page.tsx`:
- Table: timestamp, user email, action, entity, IP address
- Filters: action type, user, date range
- Read-only — no delete/edit
- Add to Sidebar under Organization section

---

### Task 2B.5 — Add Idempotency Keys ✅ DONE

**Backend**

Create `Models/IdempotencyKey.cs`:
- Id (Guid), Key (string unique), RequestHash (string), ResponseStatusCode (int), ResponseBody (string), CreatedAt (DateTime), ExpiresAt (DateTime — 24 hours)

Create `Middleware/IdempotencyMiddleware.cs`:
- Check for `Idempotency-Key` header on POST/PUT/PATCH requests
- If key exists and matches: return cached response
- If key is new: process request, store response, return
- If key exists but request hash differs: return 422 (key reuse with different payload)

This prevents double-payments from network retries or client bugs.

**Frontend**

Update `apiClient.ts`:
- Auto-generate UUID `Idempotency-Key` header on all POST requests
- Store sent keys to prevent accidental reuse

---

### Task 2B.6 — Add Concurrency Control ✅ DONE

**Backend**

Add optimistic concurrency to financial entities:

Update `PayoutBatch` model:
- Add `RowVersion` (byte[] with `[Timestamp]` attribute)

Update `Transaction` model:
- Add `RowVersion` (byte[])

Update `AppDbContext`:
- Configure `IsRowVersion()` for both entities

Update services to handle `DbUpdateConcurrencyException`:
- Reload entity, re-apply changes, retry once
- If still fails, return conflict error

Migration: add `RowVersion` columns.

---

### Task 2B.7 — Add Transaction Amount Limits & Duplicate Detection ✅ DONE

**Backend**

Create `Configurations/TransactionLimits.cs`:
- MinTransactionAmount (decimal: 100 NGN)
- MaxTransactionAmount (decimal: 10,000,000 NGN)
- MaxBatchAmount (decimal: 100,000,000 NGN)
- MaxDailyOrgAmount (decimal: 500,000,000 NGN)
- DuplicateWindowMinutes (int: 30)

Create `Services/TransactionValidationService.cs`:
- `ValidateAmountAsync(amount)` — min/max check
- `ValidateBatchAmountAsync(totalAmount, orgId)` — batch limit + daily limit
- `CheckDuplicateAsync(recipientName, accountNumber, bankId, amount, orgId)` — detect duplicates within time window
- `ValidateAccountNumberAsync(accountNumber, bankCode)` — NUBAN check digit validation for Nigerian accounts (10 digits, mod-10 algorithm)

Wire validation into `PayoutBatchService.CreateBatchFromFileAsync` and all transaction creation paths.

---

### Task 2B.8 — Add Request Rate Limiting & IP Tracking ✅ DONE

**Backend**

> Moved from Task 8.4 to here — rate limiting is a day-one security requirement for financial APIs, not a Phase 1 afterthought.

Create `Middleware/RateLimitMiddleware.cs`:
- Per API key: 100 requests/minute, 1000 requests/hour
- Per IP (unauthenticated): 20 requests/minute
- Return 429 with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers
- Use in-memory sliding window (upgrade to Redis in Phase 3)

Update `ApiKeyMiddleware.cs`:
- Record `LastUsedAt` on each request
- Track `LastUsedFromIp` (string) on ApiKey model

Migration: add `LastUsedAt`, `LastUsedFromIp` to ApiKeys.

---

## Task 3 — Organization System

---

### Task 3.1 — Create Organization DTOs ✅ DONE

**Backend**

Create DTOs/Organizations/:
- CreateOrganizationRequest (name, email, country)
- UpdateOrganizationRequest (name, email, country)
- OrganizationResponse (id, name, email, country, createdAt)
- OrganizationMemberResponse (id, userId, email, role, joinedAt)
- AddMemberRequest (email, role)

---

### Task 3.2 — Create Organization Service ✅ DONE

**Backend**

Create Services/OrganizationService.cs implementing IOrganizationService:
- CreateOrganizationAsync — creates org, adds creator as owner
- GetOrganizationAsync — returns org details
- GetUserOrganizationsAsync — returns all orgs for a user
- UpdateOrganizationAsync — update org info
- AddMemberAsync — adds user to org
- RemoveMemberAsync — removes user from org
- GetMembersAsync — lists org members

---

### Task 3.3 — Create Organization Controller ✅ DONE

**Backend**

Create Controllers/OrganizationController.cs:
- POST /api/organizations — create
- GET /api/organizations — list user's orgs
- GET /api/organizations/{id} — get details
- PUT /api/organizations/{id} — update
- POST /api/organizations/{id}/members — add member
- DELETE /api/organizations/{id}/members/{userId} — remove member
- GET /api/organizations/{id}/members — list members

All endpoints require JWT.

---

### Task 3.4 — Auto-Create Organization on Registration + Role-Based Authorization ✅ DONE

**Backend**

Update AuthService:
- When user registers, auto-create a default organization
- Add `organizationId` and `role` to JWT claims
- Wrap in a DB transaction — if org creation fails, user creation rolls back

Create `Middleware/OrganizationContextMiddleware.cs`:
- Extract org ID from JWT
- Validate user is still an active member of that org (not just trusting the token)
- Make it available to downstream services via `ICurrentOrganizationProvider`
- Scope all data queries to user's organization

Create `Services/ICurrentOrganizationProvider.cs`:
- `OrganizationId` (Guid)
- `UserId` (Guid)
- `Role` (string)
- Used by all services instead of manually extracting claims in controllers

Create `Authorization/RoleRequirement.cs`:
- `[RequireRole("owner")]`, `[RequireRole("admin", "owner")]` custom attributes
- Authorization handler that checks org membership role
- Owner: full access. Admin: manage members, create batches, manage keys. Member: read-only + upload batches.

---

### Task 3.5 — Create Organization Frontend Service ✅ DONE

**Frontend**

Create services/organizationService.ts:
- createOrganization(data) → Organization
- getOrganizations() → Organization[]
- getOrganization(id) → Organization
- updateOrganization(id, data) → Organization
- addMember(orgId, data) → OrganizationMember
- removeMember(orgId, userId) → void
- getMembers(orgId) → OrganizationMember[]

---

### Task 3.6 — Create Organization Settings Page ✅ DONE

**Frontend**

Create app/dashboard/organization/page.tsx:
- Organization name and details card
- Country and email display
- Edit button → inline form or modal
- Save changes with success toast

Update components/layout/Sidebar.tsx — add Organization Settings link.

Update components/layout/TopBar.tsx — show current org name.

---

### Task 3.7 — Create Organization Members Page ✅ DONE

**Frontend**

Create app/dashboard/organization/members/page.tsx:
- Table of members: email, role badge, joined date
- Add member button → modal with email input and role selector
- Remove member button with confirmation dialog
- Owner cannot be removed
- Role badges (owner, admin, member)

---

### Task 3.8 — Update Auth Hook for Organization Context ✅ DONE

**Frontend**

Update hooks/useAuth.ts:
- Store current organization context
- Include organizationId in auth state
- Add organization switcher if user has multiple orgs

---

## Task 4 — Bank Registry System

---

### Task 4.1 — Create Bank DTOs ✅ DONE

**Backend**

Create DTOs/Banks/:
- BankResponse (id, name, code, country, aliases)
- BankListResponse (id, name, code, country)
- CreateBankRequest (name, code, country)
- AddBankAliasRequest (alias)

---

### Task 4.2 — Create Bank Service ✅ DONE

**Backend**

Create Services/BankService.cs implementing IBankService:
- GetAllBanksAsync — all active banks
- GetBankByIdAsync — bank with aliases
- GetBankByCodeAsync — bank by code
- SearchBanksAsync(query) — search by name or alias
- CreateBankAsync — add new bank (admin)
- AddAliasAsync — add alias to bank
- FindBankByAliasAsync — find bank matching alias string

---

### Task 4.3 — Create Bank Controller ✅ DONE

**Backend**

Create Controllers/BankController.cs:
- GET /api/banks — list all banks
- GET /api/banks/{id} — bank details with aliases
- GET /api/banks/search?query={query} — search banks
- POST /api/banks — create bank (admin)
- POST /api/banks/{id}/aliases — add alias

---

### Task 4.4 — Create Bank Frontend Service ✅ DONE

**Frontend**

Create services/bankService.ts:
- getBanks() → Bank[]
- getBank(id) → Bank
- searchBanks(query) → Bank[]
- createBank(data) → Bank
- addAlias(bankId, alias) → BankAlias

---

### Task 4.5 — Create Bank Registry Page ✅ DONE

**Frontend**

Create app/dashboard/banks/page.tsx:
- Searchable table: name, code, country, alias count
- Search input with instant filtering
- Click row to expand and show aliases
- Admin: Add bank button → modal
- Admin: Add alias button on each row

Update Sidebar — add Banks link.

---

### Task 4.6 — Create Bank Selector Component ✅ DONE

**Frontend**

Create components/ui/BankSelector.tsx:
- Searchable dropdown
- Shows bank name and code
- Autocomplete with alias matching
- Reusable across bulk upload and forms

---

## Task 5 — AI Bank Normalization Service

---

### Task 5.1 — Set Up Python AI Service Project ✅ DONE

**AI Service**

Create ai-service/ directory:
- main.py (FastAPI app)
- requirements.txt (FastAPI, uvicorn, sentence-transformers, numpy, pydantic)
- normalization/ directory
- data/ directory

Create data/banks.json — all Nigerian banks with codes and aliases (synced with backend seed).

---

### Task 5.2 — Build Text Preprocessor ✅ DONE

**AI Service**

Create normalization/preprocessor.py:
- Lowercase input
- Remove special characters
- Strip whitespace
- Remove common suffixes (PLC, LTD, LIMITED)
- Normalize abbreviations

---

### Task 5.3 — Build Embedding Generator ✅ DONE

**AI Service**

Create normalization/embeddings.py:
- Load sentence-transformer model (all-MiniLM-L6-v2)
- Generate embeddings for all bank names and aliases from registry
- Store in memory for fast lookup
- Function to generate embedding for any input string

---

### Task 5.4 — Build Similarity Matching Engine ✅ DONE

**AI Service**

Create normalization/matcher.py:
1. Preprocess input
2. Check exact match against aliases
3. If no exact match, generate embedding
4. Calculate cosine similarity against all bank embeddings
5. Return best match with confidence score
6. Reject if confidence below 0.7

---

### Task 5.5 — Create Normalization API Endpoints ✅ DONE

**AI Service**

Create main.py with FastAPI:

POST /normalize-bank — single normalization
```json
Request: { "bank_name": "UBA PLC" }
Response: { "normalized_bank": "United Bank for Africa", "bank_code": "033", "confidence": 0.94, "original_input": "UBA PLC" }
```

POST /normalize-banks — batch normalization
```json
Request: { "bank_names": ["UBA PLC", "GTB", "First Bnk"] }
Response: { "results": [...] }
```

GET /health — health check

---

### Task 5.6 — Create Backend Normalization Client ✅ DONE

**Backend**

Create Services/BankNormalizationClient.cs:
- NormalizeBankNameAsync(string bankName) → NormalizationResult
- NormalizeBankNamesAsync(List<string> bankNames) → List<NormalizationResult>
- Handle timeouts and retries
- Fallback to alias-based matching if AI service unavailable

Create DTOs/Normalization/:
- NormalizationResult (normalizedBank, bankCode, confidence, originalInput)

---

### Task 5.7 — Create Normalization Test Page ✅ DONE

**Frontend**

Create app/dashboard/normalization/page.tsx:
- Text input to test single bank name
- Submit button → display result: normalized name, code, confidence
- Confidence indicator (green > 0.9, yellow > 0.7, red < 0.7)
- Batch test: textarea for multiple names (one per line)
- Results table: input → normalized → confidence

---

## Task 6 — Bulk Payment Upload System

---

### Task 6.1 — Create CSV Parser Service ✅ DONE

**Backend**

Create Services/CsvParserService.cs implementing ICsvParserService:
- ParsePaymentFileAsync(Stream fileStream) → ParseResult

Handle: header detection, column mapping (Name/RecipientName, Bank/BankName, AccountNumber/Account, Amount), data type validation, empty row skipping, error collection per row.

Return ParseResult with valid records list and errors list.

---

### Task 6.2 — Create Payout Batch DTOs ✅ DONE

**Backend**

Create DTOs/PayoutBatches/:
- CreateBatchFromFileResponse (batchId, totalRecords, validRecords, invalidRecords, errors)
- PayoutBatchResponse (id, fileName, totalRecords, totalAmount, status, successCount, failedCount, pendingCount, createdAt, completedAt)
- PayoutBatchDetailResponse (batch info + transactions list)
- PayoutBatchSummaryResponse (counts, amounts, percentages)
- BatchValidationError (rowNumber, field, message)

---

### Task 6.3 — Create Payout Batch Service ✅ DONE

**Backend**

Create Services/PayoutBatchService.cs implementing IPayoutBatchService:
- `CreateBatchFromFileAsync(file, fileName, orgId, userId)`:
  - Parse CSV → validate each row → normalize banks → check duplicates → validate amounts → validate account numbers (NUBAN)
  - Wrap batch + all transactions in a single DB transaction — all or nothing
  - Call `TransactionValidationService` for amount limits and duplicate detection
  - Call `AuditService.LogAsync("batch.created", ...)`
  - Return validation errors per row — do NOT silently skip bad data
- `GetBatchesAsync(orgId, filters)` — list with pagination, always scoped to org
- `GetBatchDetailAsync(batchId)` — batch with transactions, verify org ownership
- `GetBatchSummaryAsync(batchId)` — status and counts
- `RetryFailedTransactionsAsync(batchId)` — retry failed, increment retry count, max 3 retries
- `CancelBatchAsync(batchId)` — cancel only if status is "pending", audit log it

All methods must verify the batch belongs to the requesting organization (defense in depth — don't rely only on middleware).

---

### Task 6.4 — Create Payout Batch Controller ✅ DONE

**Backend**

Create Controllers/PayoutBatchController.cs:
- POST /api/payout-batches/upload — upload CSV (multipart/form-data)
- GET /api/payout-batches — list batches (paginated, filterable)
- GET /api/payout-batches/{id} — batch detail with transactions
- GET /api/payout-batches/{id}/summary — summary
- POST /api/payout-batches/{id}/retry — retry failed
- POST /api/payout-batches/{id}/cancel — cancel batch

Validate: CSV type, 10MB max, 10,000 rows max, required columns, no empty files.

---

### Task 6.5 — Create Payout Batch Frontend Service ✅ DONE

**Frontend**

Create services/payoutBatchService.ts:
- uploadBatch(file) → CreateBatchFromFileResponse
- getBatches(filters?) → PaginatedResponse<PayoutBatch>
- getBatchDetail(id) → PayoutBatchDetail
- getBatchSummary(id) → PayoutBatchSummary
- retryFailed(id) → void
- cancelBatch(id) → void

---

### Task 6.6 — Create Reusable UI Components for Bulk Upload ✅ DONE

**Frontend**

Create components/ui/FileUpload.tsx — drag-and-drop CSV upload with validation, progress, error display.

Create components/ui/DataTable.tsx — sortable, paginated table with loading skeleton and empty state.

Create components/ui/Pagination.tsx — page numbers, prev/next, page size selector.

Create components/ui/StatusBadge.tsx — color-coded status badges (pending=yellow, processing=blue, completed=green, failed=red).

Create components/ui/EmptyState.tsx — icon, title, description, optional action button.

Create components/ui/ProgressBar.tsx — segmented bar showing success/failed/pending proportions.

Create components/ui/FilterBar.tsx — status dropdown, date range, search input, clear button.

---

### Task 6.7 — Create Bulk Upload Page ✅ DONE

**Frontend**

Create app/dashboard/bulk-upload/page.tsx with step flow:

Step 1 — Upload: FileUpload component, sample CSV download link, file requirements.

Step 2 — Preview: first 10 rows table, column mapping, validation errors per row in red, bank normalization preview (original → normalized with confidence).

Step 3 — Confirm: summary card (total, valid, invalid, amount), error list, confirm button, cancel button.

Step 4 — Processing: animated progress bar, live counters, redirect to batch detail when done.

---

### Task 6.8 — Create Payout Batches List Page ✅ DONE

**Frontend**

Create app/dashboard/payout-batches/page.tsx:
- Quick stats at top: total batches, total volume, avg success rate
- FilterBar: status dropdown, file name search, date range
- DataTable: batch ID, file name, total records, total amount, status badge, success/failed counts, date
- Pagination
- Click row → navigate to batch detail

Update Sidebar — add Bulk Upload and Payout Batches links.

---

### Task 6.9 — Create Batch Detail Page ✅ DONE

**Frontend**

Create app/dashboard/payout-batches/[id]/page.tsx:
- Header: file name, created date, created by
- Summary cards: total records, total amount, success count, failed count, pending count
- ProgressBar (success vs failed vs pending)
- Success rate percentage
- Transaction DataTable: recipient, bank (raw → normalized), account, amount, status badge, failure reason, confidence
- Filter transactions by status
- Retry failed button (with confirmation)
- Cancel batch button (if pending)
- Export results as CSV button

---

## Task 7 — Transaction Processing Engine

---

### Task 7.1 — Create Transaction Processing Service ✅ DONE

**Backend**

Create Services/TransactionProcessingService.cs implementing ITransactionProcessingService:
- `ProcessBatchAsync(batchId)`:
  - Acquire a processing lock (prevent double-processing of same batch)
  - Update batch status to "processing" with optimistic concurrency check
  - Process each transaction individually — one failure doesn't stop the batch
  - Update batch counters atomically using SQL UPDATE (not read-modify-write)
  - Mark batch completed/partially_failed when all transactions are processed
  - Audit log: "batch.processing_started", "batch.completed"
- `ProcessTransactionAsync(transactionId)`:
  - Validate bank exists and is active
  - Validate account number format (NUBAN)
  - Re-check duplicate within processing window
  - Process payout (simulated in MVP, real bank API in Phase 3)
  - Update status to completed/failed with timestamp
  - On failure: store reason, do NOT retry automatically — let user decide
  - Audit log each status change
- `RetryTransactionAsync(transactionId)`:
  - Max 3 retries enforced
  - Increment retry count
  - Re-validate before retry (bank could have been deactivated)
  - Audit log: "transaction.retried"

All status transitions must be valid: pending → processing → completed/failed. No skipping states. No going backward except retry (failed → pending).

---

### Task 7.2 — Create Background Job System ✅ DONE

**Backend**

Create Jobs/ directory.

Set up BackgroundService or Hangfire.

Create ProcessPayoutBatchJob — processes all transactions in a batch asynchronously.

Create RetryFailedTransactionsJob — retries failed transactions in a batch.

Jobs must: run without blocking API, update status in real-time, handle failures, support cancellation.

---

### Task 7.3 — Create Transaction DTOs ✅ DONE

**Backend**

Create/update DTOs/Transactions/:
- TransactionDetailResponse (all fields including bank info, normalization data)
- TransactionListResponse (paginated)
- TransactionStatsResponse (total, completed, failed, pending, totalAmount, successRate)
- TransactionFilterRequest (status, batchId, dateFrom, dateTo, search, page, pageSize)

---

### Task 7.4 — Update Transaction Controller ✅ DONE

**Backend**

Update Controllers/TransactionController.cs:
- GET /api/transactions — list with filters and pagination
- GET /api/transactions/{id} — transaction detail
- GET /api/transactions/stats — statistics for the organization

Filters: status, batchId, dateFrom, dateTo, search, page, pageSize.

---

### Task 7.5 — Update Transaction Frontend Service ✅ DONE

**Frontend**

Update services/transactionService.ts:
- getTransactions(filters?) → PaginatedResponse<TransactionDetail>
- getTransaction(id) → TransactionDetail
- getTransactionStats() → TransactionStats

---

### Task 7.6 — Create Transaction Detail Modal ✅ DONE

**Frontend**

Create components/dashboard/TransactionDetailModal.tsx:
- Recipient name, bank info (raw → normalized, code, confidence)
- Account number, amount, currency
- Status timeline (pending → validating → processing → completed/failed)
- Failure reason if failed
- Retry count, batch link
- Created and processed timestamps

---

### Task 7.7 — Enhance Transactions Page ✅ DONE

**Frontend**

Update app/dashboard/transactions/page.tsx:
- Stats summary cards: total, completed, failed, pending, volume, success rate
- FilterBar: status, batch selector, date range, search
- DataTable: ID, recipient, bank (raw → normalized), account, amount, status, date
- Click row → open TransactionDetailModal
- Pagination
- Export CSV button

---

### Task 7.8 — Enhance Dashboard Overview ✅ DONE

**Frontend**

Update app/dashboard/page.tsx:
- StatCard components with trend indicators: Total Transactions, Total Volume, Success Rate, Active Batches
- Recent batches table (last 5)
- Recent transactions table (last 10)
- Quick action: "Upload CSV" button

Create components/ui/StatCard.tsx — title, value, trend arrow with %, icon, color.

---

## Task 8 — Update Payout & API Key Systems

---

### Task 8.1 — Restructure Payout System ✅ DONE

**Backend**

Remove old simple payout creation endpoint.

Payouts now created through batch uploads only in MVP.

Update PayoutController:
- GET /api/payouts — list for organization (paginated)
- GET /api/payouts/{id} — details

Update PayoutService to work with batch-based system.

---

### Task 8.2 — Update Payouts Page ✅ DONE

**Frontend**

Update app/dashboard/payouts/page.tsx:
- Table: ID, batch link, recipient, bank, amount, status, date
- Filter by status
- Pagination
- Link to parent batch

---

### Task 8.3 — Scope API Keys to Organizations ✅ DONE

**Backend**

Update ApiKey model:
- Add OrganizationId (Guid FK)
- Add Permissions (string: read/write/admin)

Update ApiKeyService: create keys scoped to org, validate against org context, check permissions.

Run migration.

---

### Task 8.4 — Create Rate Limit Middleware ↗️ MOVED to Task 2B.8

(Moved to Phase 1 security hardening — rate limiting is a day-one requirement for financial APIs.)

---

### Task 8.5 — Enhance API Keys Page ✅ DONE

**Frontend**

Update app/dashboard/api-keys/page.tsx:
- Create key with permission selector (read/write/admin)
- Show permission level badge on each key
- Show organization key belongs to
- Key shown fully only once on creation (one-time modal with copy + warning)
- Rate limit info display
- Revoke with confirmation dialog

---

## Task 9 — Notification System

---

### Task 9.1 — Create Notification Model ✅ DONE

**Backend**

Create Models/Notification.cs:
- Id (Guid), OrganizationId (Guid FK), UserId (Guid FK nullable)
- Type (string: batch_completed/batch_failed/transaction_failed/api_key_created)
- Title (string), Message (string), IsRead (bool), CreatedAt

Run migration.

---

### Task 9.2 — Create Notification Service ✅ DONE

**Backend**

Create Services/NotificationService.cs implementing INotificationService:
- CreateNotificationAsync — create notification
- GetNotificationsAsync(userId, unreadOnly?) — list
- MarkAsReadAsync(notificationId)
- MarkAllAsReadAsync(userId)
- GetUnreadCountAsync(userId)

---

### Task 9.3 — Create Notification Controller ✅ DONE

**Backend**

Create Controllers/NotificationController.cs:
- GET /api/notifications — list
- GET /api/notifications/unread-count — count
- PUT /api/notifications/{id}/read — mark read
- PUT /api/notifications/read-all — mark all read

---

### Task 9.4 — Trigger Notifications from Services ✅ DONE

**Backend**

Add notification triggers:
- PayoutBatchService → batch_completed, batch_failed
- TransactionProcessingService → transaction_failed (bulk)
- ApiKeyService → api_key_created

---

### Task 9.5 — Create Notification Frontend Service ✅ DONE

**Frontend**

Create services/notificationService.ts:
- getNotifications(unreadOnly?) → Notification[]
- getUnreadCount() → number
- markAsRead(id) → void
- markAllAsRead() → void

---

### Task 9.6 — Create Notification Bell Component ✅ DONE

**Frontend**

Create components/layout/NotificationBell.tsx:
- Bell icon with unread count badge
- Click → dropdown with recent notifications
- Each: icon, title, message, time ago
- Mark as read on click
- "Mark all as read" button
- "View all" link
- Poll unread count every 30 seconds

Update components/layout/TopBar.tsx — add NotificationBell.

---

### Task 9.7 — Create Notifications Page ✅ DONE

**Frontend**

Create app/dashboard/notifications/page.tsx:
- All notifications list
- Filter: all / unread
- Notification card: type icon, title, message, timestamp
- Click to mark read
- Unread highlighted
- Pagination

---

## Task 10 — Testing

---

### Task 10.1 — Set Up Backend Test Project ✅ DONE

**Backend**

Create forge-api.Tests project.

Install: xUnit, Moq, FluentAssertions, EF Core InMemory.

Configure test infrastructure and helpers.

---

### Task 10.2 — Write Auth and Organization Service Tests ✅ DONE

**Backend**

AuthService: register valid, register duplicate email, login valid, login wrong password.

OrganizationService: create org, add member, remove member, get user orgs.

---

### Task 10.3 — Write Payout Batch and CSV Parser Tests ✅ DONE

**Backend**

CsvParserService: valid file, missing columns, invalid data, empty rows, large files.

PayoutBatchService: create from valid CSV, reject invalid, handle normalization, status updates.

---

### Task 10.4 — Write Transaction and Bank Service Tests ✅ DONE

**Backend**

TransactionProcessingService: process single, process batch, retry failed, status lifecycle.

BankService: search by name, search by alias, find by code.

---

### Task 10.5 — Write Controller Integration Tests ✅ DONE

**Backend**

Test all endpoints: auth required, status codes, response format, validation errors, org scoping.

---

### Task 10.6 — Set Up Frontend Testing ✅ DONE

**Frontend**

Install: Jest, React Testing Library, MSW.

Configure test setup.

---

### Task 10.7 — Write Frontend Component Tests ✅ DONE

**Frontend**

Test: FileUpload (drag/drop/validation), DataTable (sort/paginate), Dashboard (data loading), Bulk upload flow (upload → preview → confirm → processing).

---

---

# PHASE 2 — DEVELOPER PLATFORM

---

## Task 11 — Public Developer API

---

### Task 11.1 — Create Versioned API Endpoints ✅ DONE

**Backend**

Create /api/v1/ routes authenticated via API key:
- POST /api/v1/payout-batches — create batch via JSON
- POST /api/v1/payouts — create single payout
- GET /api/v1/payout-batches/{id} — batch status
- GET /api/v1/payout-batches/{id}/transactions — batch transactions
- GET /api/v1/transactions — list
- GET /api/v1/transactions/{id} — detail
- GET /api/v1/banks — list supported banks
- GET /api/v1/banks/normalize?name={name} — normalize bank name

---

### Task 11.2 — Create Developer API DTOs ✅ DONE

**Backend**

Create V1-specific DTOs:
- V1CreatePayoutBatchRequest (payments array: recipientName, bankName, accountNumber, amount)
- V1CreatePayoutRequest (recipientName, bankName, accountNumber, amount)
- V1 response DTOs matching public API format

Implement API versioning support for future v2.

---

### Task 11.3 — Create API Documentation Page ✅ DONE

**Frontend**

Create app/docs/page.tsx:
- Navigation sidebar with endpoint categories
- Each endpoint: method badge, URL, description, auth info, params table, request/response JSON examples, status codes
- Authentication guide (JWT + API keys)
- Rate limiting info
- Code examples in tabs: cURL, JavaScript, Python, C#
- Copy button for code snippets

---

### Task 11.4 — Create Quickstart Guide Page ✅ DONE

**Frontend**

Create app/docs/quickstart/page.tsx:
- Step 1: Create account
- Step 2: Create organization
- Step 3: Generate API key
- Step 4: Make first API call (code example)
- Step 5: Upload first batch
- Step 6: Check results

---

### Task 11.5 — Create Developer Dashboard Section ✅ DONE

**Frontend**

Create app/dashboard/developer/page.tsx:
- API key management link
- API usage stats: total requests, requests today, errors
- Recent API requests log: timestamp, endpoint, method, status code, latency
- Quick links to docs

Update Sidebar — add Developer section.

---

## Task 12 — Webhook System

---

### Task 12.1 — Create Webhook Models ✅ DONE

**Backend**

Create Models/WebhookEndpoint.cs:
- Id (Guid), OrganizationId (Guid FK), Url (string), Events (string comma-separated), Secret (string), IsActive (bool), CreatedAt

Create Models/WebhookDelivery.cs:
- Id (Guid), WebhookEndpointId (Guid FK), Event (string), Payload (string JSON), StatusCode (int nullable), Response (string nullable), DeliveredAt (nullable), Attempts (int), NextRetryAt (nullable)

Run migration.

---

### Task 12.2 — Create Webhook Service ✅ DONE

**Backend**

Create Services/WebhookService.cs implementing IWebhookService:
- `RegisterEndpointAsync` — auto-generate signing secret (32 bytes), store hashed
- `GetEndpointsAsync`, `RemoveEndpointAsync`
- `SendWebhookAsync(orgId, event, payload)`:
  - Sign payload with HMAC-SHA256 using endpoint secret
  - Include headers: `X-Forge-Signature`, `X-Forge-Event`, `X-Forge-Delivery-Id`, `X-Forge-Timestamp`
  - Timeout: 10 seconds per delivery
  - Never include sensitive data (full account numbers, keys) in payloads — mask them
- `TestEndpointAsync` — send test event with sample payload
- `RetryDeliveryAsync` — retry failed (up to 5 attempts, exponential backoff: 1m, 5m, 30m, 2h, 24h)
- Audit log all webhook registrations and removals

---

### Task 12.3 — Create Webhook Controller ✅ DONE

**Backend**

Create Controllers/WebhookController.cs:
- POST /api/webhooks — register
- GET /api/webhooks — list
- DELETE /api/webhooks/{id} — remove
- POST /api/webhooks/{id}/test — test
- GET /api/webhooks/{id}/deliveries — delivery history

---

### Task 12.4 — Integrate Webhook Triggers ✅ DONE

**Backend**

Update PayoutBatchService and TransactionProcessingService to call WebhookService on:
- batch.completed, batch.failed, transaction.completed, transaction.failed

---

### Task 12.5 — Create Webhook Frontend Service ✅ DONE

**Frontend**

Create services/webhookService.ts:
- registerWebhook(data) → WebhookEndpoint
- getWebhooks() → WebhookEndpoint[]
- removeWebhook(id) → void
- testWebhook(id) → void
- getDeliveries(webhookId) → WebhookDelivery[]

---

### Task 12.6 — Create Webhooks Management Page ✅ DONE

**Frontend**

Create app/dashboard/webhooks/page.tsx:
- List: URL, events, status, created date
- Add webhook → modal: URL input, event checkboxes, auto-generated secret (copyable)
- Test button, delete button with confirmation
- Click webhook → view delivery history

Update Sidebar — add Webhooks link under Developer section.

---

### Task 12.7 — Create Webhook Delivery History Page ✅ DONE

**Frontend**

Create app/dashboard/webhooks/[id]/page.tsx:
- Webhook URL and events at top
- Deliveries table: event, status code, delivered at, attempts
- Status badges (2xx green, error red, pending yellow)
- Click delivery → view full payload and response
- Retry button for failed

---

## Task 13 — Reports & Export

---

### Task 13.1 — Create Report Service ✅ DONE

**Backend**

Create Services/ReportService.cs implementing IReportService:
- ExportBatchResultsAsync(batchId) → CSV stream
- ExportTransactionsAsync(filters) → CSV stream
- GenerateSummaryReportAsync(orgId, dateFrom, dateTo) → SummaryReport (totals, success rate, top banks, daily breakdown)

---

### Task 13.2 — Create Report Controller ✅ DONE

**Backend**

Create Controllers/ReportController.cs:
- GET /api/reports/batches/{id}/export — download batch CSV
- GET /api/reports/transactions/export — download transactions CSV
- GET /api/reports/summary?from={date}&to={date} — summary data

---

### Task 13.3 — Create Report Frontend Service ✅ DONE

**Frontend**

Create services/reportService.ts:
- exportBatchResults(batchId) → triggers CSV download
- exportTransactions(filters) → triggers CSV download
- getSummaryReport(dateFrom, dateTo) → SummaryReport

---

### Task 13.4 — Create Reports Page ✅ DONE

**Frontend**

Create app/dashboard/reports/page.tsx:
- Date range selector
- Summary cards: total batches, transactions, volume, success rate
- Top banks table
- Daily breakdown table
- Export buttons for CSV downloads

Update Sidebar — add Reports link.

---

### Task 13.5 — Add Export Buttons to Existing Pages ✅ DONE

**Frontend**

Add "Export CSV" button to:
- Batch detail page (export results)
- Transactions page (export filtered transactions)

---

## Task 14 — Email Notifications

---

### Task 14.1 — Create Email Service ✅ DONE

**Backend**

Integrate SendGrid or SMTP.

Create Services/EmailService.cs implementing IEmailService:
- SendRegistrationConfirmationAsync(email, name)
- SendBatchCompletedAsync(email, batchSummary)
- SendBatchFailedAsync(email, batchSummary)
- SendFailedTransactionsAlertAsync(email, failedCount, batchId)
- SendWeeklySummaryAsync(email, summaryData)

---

### Task 14.2 — Create Email Templates ✅ DONE

**Backend**

Create HTML email templates:
- Welcome / registration confirmation
- Batch completed (with stats)
- Batch failed (with error summary)
- Failed transactions alert
- Weekly digest

---

### Task 14.3 — Create Weekly Summary Email Job ✅ DONE

**Backend**

Create Jobs/WeeklySummaryEmailJob.cs:
- Run weekly
- Gather stats per organization
- Send digest to org owners

---

### Task 14.4 — Create Settings Page ✅ DONE

**Frontend**

Create app/dashboard/settings/page.tsx:
- Profile section: name, email
- Notification preferences toggles:
  - Email on batch completed
  - Email on batch failed
  - Email on failed transactions
  - Weekly summary email
- Save preferences button

Update Sidebar — add Settings link.

---

## Task 14B — Data Protection & PII Security

> Financial systems handle sensitive personal data (names, bank accounts, amounts). This task ensures proper handling.

---

### Task 14B.1 — Account Number Masking ✅ DONE

**Backend**

Create `Utils/DataMasking.cs`:
- `MaskAccountNumber("1234567890")` → `"******7890"` (show last 4 only)
- `MaskEmail("user@email.com")` → `"u***@email.com"`
- `MaskName("Abubakar Mohammed")` → `"A****** M*******"`

Apply masking to:
- All API responses (TransactionResponse, PayoutResponse) — except when queried by org owner/admin
- Webhook payloads — always masked
- Audit logs — always masked
- CSV exports — configurable (masked by default, full data requires owner role + confirmation)

---

### Task 14B.2 — Sensitive Field Encryption at Rest ✅ DONE

**Backend**

Create `Utils/FieldEncryption.cs`:
- AES-256-GCM encryption for sensitive database fields
- Key managed via configuration (will move to vault in Phase 5)

Encrypt at rest:
- `Transaction.AccountNumber`
- `ApiKey.KeyHash` (already hashed, but encrypt the hash)
- `WebhookEndpoint.Secret`
- `RefreshToken.TokenHash`

Create `Services/EncryptionService.cs`:
- `Encrypt(plaintext)` → ciphertext
- `Decrypt(ciphertext)` → plaintext
- Key rotation support (decrypt with old key, re-encrypt with new)

Migration: update column types to accommodate encrypted data length.

---

### Task 14B.3 — Request/Response Logging Sanitization ✅ DONE

**Backend**

Create `Middleware/RequestLoggingMiddleware.cs`:
- Log: method, path, status code, duration, user ID, org ID, IP
- NEVER log: request bodies containing passwords, tokens, account numbers, API keys
- Sanitize headers: mask `Authorization` and `X-API-Key` values in logs
- Structured logging with correlation IDs (`X-Correlation-Id` header)

---

---

# PHASE 3 — PAYMENT INFRASTRUCTURE EXPANSION

---

## Task 15 — Payment Provider Integration

---

### Task 15.1 — Create Payment Provider Interface ✅

**Backend**

Create Services/PaymentProviders/IPaymentProvider.cs:
- ProcessPayoutAsync(transaction) → PaymentResult
- GetTransactionStatusAsync(reference) → status
- ValidateAccountAsync(bankCode, accountNumber) → AccountInfo

---

### Task 15.2 — Implement First Payment Provider ✅

**Backend**

Create Services/PaymentProviders/PaystackProvider.cs (or Flutterwave):
- API authentication
- Send payout requests
- Handle status callbacks
- Error handling and mapping
- Receive webhooks from provider

---

### Task 15.3 — Create Account Validation Service ✅

**Backend**

Create Services/AccountValidationService.cs:
- Call provider's account lookup API
- Verify account exists
- Verify name matches recipient
- Flag mismatches for review
- Return: accountName, bankName, isValid

---

### Task 15.4 — Add Provider Configuration ✅

**Backend**

Store credentials securely (env vars).

Support multiple providers.

Per-organization provider config.

Update TransactionProcessingService to use real provider instead of simulation.

---

### Task 15.5 — Update Settings Page for Provider ✅

**Frontend**

Update app/dashboard/settings/page.tsx:
- Payment provider section: connected provider display, status, test connection button
- Provider credentials form (masked fields)

---

### Task 15.6 — Update Transaction Detail for Provider Info ✅

**Frontend**

Update TransactionDetailModal:
- Provider reference number
- Provider status
- Account validation result (name match, verified)

Update bulk upload preview — add account validation column.

---

## Task 16 — Wallet System

---

### Task 16.1 — Create Wallet Models ✅

**Backend**

Create Models/Wallet.cs:
- Id (Guid), OrganizationId (Guid FK unique), Balance (decimal), Currency (string), IsActive (bool), CreatedAt, UpdatedAt

Create Models/WalletTransaction.cs:
- Id (Guid), WalletId (Guid FK), Type (credit/debit/refund), Amount (decimal), Reference (string), Description (string), BalanceBefore (decimal), BalanceAfter (decimal), CreatedAt

Run migration.

---

### Task 16.2 — Create Wallet Service ✅

**Backend**

Create Services/WalletService.cs implementing IWalletService:
- GetWalletAsync(orgId) → Wallet
- CreditWalletAsync(orgId, amount, reference, description)
- DebitWalletAsync(orgId, amount, reference, description)
- GetWalletHistoryAsync(orgId, filters) → PaginatedResponse<WalletTransaction>
- HasSufficientBalanceAsync(orgId, amount) → bool

All operations must use database transactions for atomicity.

---

### Task 16.3 — Create Wallet Controller ✅

**Backend**

Create Controllers/WalletController.cs:
- GET /api/wallet — balance
- GET /api/wallet/history — transaction history
- POST /api/wallet/fund — initiate funding

---

### Task 16.4 — Integrate Wallet with Payout Processing ✅

**Backend**

Update PayoutBatchService:
- Check wallet balance before processing
- Debit wallet for batch total
- Reject if insufficient funds
- Refund on failed transactions

---

### Task 16.5 — Create Wallet Frontend Service ✅

**Frontend**

Create services/walletService.ts:
- getWallet() → Wallet
- getWalletHistory(filters?) → PaginatedResponse<WalletTransaction>
- fundWallet(amount) → FundingResponse

---

### Task 16.6 — Create Wallet Page ✅

**Frontend**

Create app/dashboard/wallet/page.tsx:
- Balance card: large balance, currency
- Fund wallet button → modal with amount input
- History table: type badge (credit green, debit red, refund blue), amount, reference, description, balance after, date
- Filter by type and date
- Pagination

Update Sidebar — add Wallet link.

---

### Task 16.7 — Add Wallet to Dashboard and Bulk Upload ✅

**Frontend**

Update dashboard overview — add wallet balance card, low balance warning.

Update bulk upload confirm step — show current balance, batch total, remaining balance, block if insufficient.

---

## Task 17 — Recurring Payments

---

### Task 17.1 — Create Recurring Payment Models

**Backend**

Create Models/RecurringSchedule.cs:
- Id (Guid), OrganizationId (Guid FK), Name (string), Frequency (daily/weekly/biweekly/monthly), NextRunAt, CsvTemplateData (string), IsActive (bool), CreatedByUserId (Guid FK), CreatedAt, UpdatedAt

Create Models/RecurringExecution.cs:
- Id (Guid), ScheduleId (Guid FK), PayoutBatchId (Guid FK), ExecutedAt, Status (completed/failed)

Run migration.

---

### Task 17.2 — Create Recurring Payment Service

**Backend**

Create Services/RecurringPaymentService.cs implementing IRecurringPaymentService:
- CreateScheduleAsync, GetSchedulesAsync, GetScheduleAsync, UpdateScheduleAsync
- PauseScheduleAsync, ResumeScheduleAsync, DeleteScheduleAsync

---

### Task 17.3 — Create Recurring Payment Job

**Backend**

Create Jobs/RecurringPaymentJob.cs:
- Run daily
- Find schedules where NextRunAt <= now and IsActive
- Create batch from template, process it
- Record execution, set NextRunAt

---

### Task 17.4 — Create Recurring Payment Frontend Service

**Frontend**

Create services/recurringPaymentService.ts:
- createSchedule(data) → RecurringSchedule
- getSchedules() → RecurringSchedule[]
- getSchedule(id) → RecurringSchedule with executions
- updateSchedule(id, data), pauseSchedule(id), resumeSchedule(id), deleteSchedule(id)

---

### Task 17.5 — Create Recurring Payments List Page

**Frontend**

Create app/dashboard/recurring/page.tsx:
- Table: name, frequency, next run, status (active/paused), last run result
- Create schedule button → wizard: name + frequency → upload CSV → preview → confirm
- Pause/resume toggle, delete with confirmation
- Click → detail page

Update Sidebar — add Recurring Payments link.

---

### Task 17.6 — Create Recurring Payment Detail Page

**Frontend**

Create app/dashboard/recurring/[id]/page.tsx:
- Schedule info: name, frequency, next run, status
- Template preview table
- Edit button → update frequency or template
- Execution history: date, batch link, status
- Click execution → batch detail

---

---

# PHASE 4 — PLATFORM INTELLIGENCE

---

## Task 18 — Analytics Dashboard

---

### Task 18.1 — Create Analytics Service

**Backend**

Create Services/AnalyticsService.cs implementing IAnalyticsService:
- GetOverviewAsync(orgId) → key metrics
- GetVolumeOverTimeAsync(orgId, period) → daily/weekly/monthly data
- GetBankDistributionAsync(orgId) → top banks by count and volume
- GetSuccessRateTrendsAsync(orgId, period) → trends
- GetProcessingTimeStatsAsync(orgId) → avg times
- GetPeakHoursAsync(orgId) → count by hour

---

### Task 18.2 — Create Analytics Controller

**Backend**

Create Controllers/AnalyticsController.cs:
- GET /api/analytics/overview
- GET /api/analytics/volume?period=daily|weekly|monthly
- GET /api/analytics/banks
- GET /api/analytics/trends?period=daily|weekly|monthly
- GET /api/analytics/processing-time

---

### Task 18.3 — Create Analytics Frontend Service

**Frontend**

Create services/analyticsService.ts:
- getOverview() → AnalyticsOverview
- getVolume(period) → VolumeData[]
- getBankDistribution() → BankDistribution[]
- getSuccessRateTrends(period) → TrendData[]
- getProcessingTimeStats() → ProcessingTimeStats

---

### Task 18.4 — Install Charts and Create Chart Components

**Frontend**

Install Recharts.

Create components/charts/LineChart.tsx — reusable line chart wrapper.

Create components/charts/BarChart.tsx — reusable bar chart wrapper.

Create components/charts/PieChart.tsx — reusable pie chart wrapper.

---

### Task 18.5 — Create Analytics Page

**Frontend**

Create app/dashboard/analytics/page.tsx:
- Date range selector (7d, 30d, 90d, custom)
- Period toggle (daily/weekly/monthly)
- Overview cards: total volume, transaction count, success rate, avg processing time
- LineChart: volume over time
- LineChart: success rate trend
- BarChart: top 10 banks
- PieChart: status distribution
- BarChart: transactions by hour

Update Sidebar — add Analytics link.

---

## Task 19 — Advanced AI Normalization

---

### Task 19.1 — Add Learning from Corrections

**AI Service**

Add POST /feedback endpoint:
```json
{ "original_input": "UBA Lagos Branch", "corrected_bank": "United Bank for Africa" }
```
Store corrections, update embeddings, improve future matching.

---

### Task 19.2 — Add Multi-Country Support

**AI Service**

Expand bank registry for multiple countries.

Separate embedding spaces per country.

Add country parameter: `{ "bank_name": "UBA PLC", "country": "NG" }`

---

### Task 19.3 — Create Normalization Feedback Backend

**Backend**

Create Controllers/NormalizationFeedbackController.cs:
- POST /api/normalization/feedback — submit correction

Update BankNormalizationClient — add country param, forward feedback.

---

### Task 19.4 — Add Correction UI to Transaction Detail

**Frontend**

Update TransactionDetailModal:
- If confidence < 0.9, show "Correct this?" link
- Dropdown to select correct bank
- Submit correction → API
- Confirmation toast

---

### Task 19.5 — Update Normalization Test Page

**Frontend**

Update app/dashboard/normalization/page.tsx:
- Add country selector
- Correction history section
- Accuracy stats: accepted vs corrected percentage

---

## Task 20 — Audit & Compliance

---

### Task 20.1 — Create Audit Log Model

**Backend**

Create Models/AuditLog.cs:
- Id (Guid), OrganizationId (Guid FK), UserId (Guid FK nullable)
- Action (string), EntityType (string), EntityId (string), Details (string JSON), IpAddress (string), CreatedAt

Run migration.

---

### Task 20.2 — Create Audit Service

**Backend**

Create Services/AuditService.cs implementing IAuditService:
- LogAsync(orgId, userId, action, entityType, entityId, details, ipAddress)
- GetLogsAsync(orgId, filters) → PaginatedResponse<AuditLog>
- ExportLogsAsync(orgId, filters) → CSV stream

---

### Task 20.3 — Create Audit Controller

**Backend**

Create Controllers/AuditController.cs:
- GET /api/audit-logs — list with filters and pagination
- GET /api/audit-logs/export — CSV export

---

### Task 20.4 — Integrate Audit Logging Across Services

**Backend**

Add audit calls to: AuthService, OrganizationService, PayoutBatchService, TransactionProcessingService, ApiKeyService, WebhookService, WalletService.

Actions: user.login, batch.created, batch.processed, transaction.completed, apikey.created, apikey.revoked, org.updated, member.added, member.removed, settings.changed.

---

### Task 20.5 — Create Audit Log Frontend Service

**Frontend**

Create services/auditService.ts:
- getAuditLogs(filters?) → PaginatedResponse<AuditLog>
- exportAuditLogs(filters?) → triggers CSV download

---

### Task 20.6 — Create Audit Log Page

**Frontend**

Create app/dashboard/audit-log/page.tsx:
- FilterBar: action type, user, entity type, date range, search
- Table: timestamp, user email, action badge, entity type, entity ID, IP
- Click row → expand to show full details JSON
- Action badges colored by category
- Export CSV button, pagination

Update Sidebar — add Audit Log under Compliance section.

---

---

# PHASE 5 — PRODUCTION READINESS

---

## Task 21 — Security Hardening

---

### Task 21.1 — Input Sanitization

**Backend**

Sanitize all inputs against SQL injection, XSS, command injection, path traversal.

Validate and encode all string outputs.

---

### Task 21.2 — Global Rate Limiting

**Backend**

Implement per-IP, per-API-key, per-session rate limiting.

Use ASP.NET Core rate limiting middleware.

Configure limits in appsettings.json.

---

### Task 21.3 — CORS and Security Headers

**Backend**

Lock CORS to specific frontend domains. No wildcards in production.

Add security headers: X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security.

---

### Task 21.4 — Secure Configuration

**Backend**

Move all secrets to environment variables or secret manager.

Create appsettings.Production.json template (no real values).

Never commit secrets.

---

### Task 21.5 — API Key Hashing

**Backend**

Store API keys as hashed values. Show full key only once on creation. Compare using hash.

Update ApiKeyMiddleware and ApiKeyService.

---

### Task 21.6 — Frontend Security

**Frontend**

Add CSP headers via next.config.js.

Sanitize user-generated content in UI.

Session timeout: auto-logout after inactivity.

"Session expired" modal with re-login.

Update API keys page: one-time key display modal with "won't be shown again" warning.

---

## Task 22 — Performance Optimization

---

### Task 22.1 — Database Indexing

**Backend**

Add indexes: Transactions (status, orgId, batchId, createdAt), PayoutBatches (orgId, status, createdAt), Banks (code, name), BankAliases (alias), ApiKeys (key hash), AuditLogs (orgId, action, createdAt), WalletTransactions (walletId, createdAt).

---

### Task 22.2 — Add Redis Caching

**Backend**

Add Redis. Cache: bank registry (10min), org details (5min), API key validation (1min), analytics (5min), unread notification count (30s).

---

### Task 22.3 — Optimize Bulk Processing

**Backend**

Stream CSV processing (no full file in memory). Batch DB inserts (100 at a time). Parallel transaction processing. Connection pooling optimization.

---

### Task 22.4 — Frontend Performance

**Frontend**

Add loading skeletons for all tables and cards.

Create components/ui/Skeleton.tsx (line, card, table row, stat card variants).

Virtual scrolling for large tables (react-virtual). Code splitting (dynamic imports). Debounce search inputs (300ms). Memoize expensive renders. Optimistic UI for common actions.

---

## Task 23 — Monitoring & Logging

---

### Task 23.1 — Structured Logging

**Backend**

Implement Serilog: console (dev), file (staging), external sink (production).

Include correlation IDs. Log requests, errors, processing events, performance.

---

### Task 23.2 — Health Check Endpoints

**Backend**

- GET /health — basic 200
- GET /health/ready — DB connected, AI service reachable, Redis connected
- GET /health/live — process alive

---

### Task 23.3 — Application Metrics

**Backend**

Track: request count/latency, transaction processing time, batch throughput, error rates, DB query performance.

Expose via Prometheus or Application Insights.

---

### Task 23.4 — System Health Page

**Frontend**

Create app/dashboard/system/page.tsx (admin):
- Status indicators: API, AI Service, DB, Redis (green/red)
- Response time graphs
- Error rate display
- Manual refresh button

---

### Task 23.5 — Frontend Error Boundary

**Frontend**

Create components/ErrorBoundary.tsx:
- Catch render errors
- Fallback UI with error message
- Retry button
- Report issue link

Add to app layout.

---

## Task 24 — DevOps & Deployment

---

### Task 24.1 — Create Dockerfiles

Create:
- backend/Dockerfile (ASP.NET Core multi-stage)
- frontend/Dockerfile (Next.js standalone)
- ai-service/Dockerfile (Python with model pre-download)

---

### Task 24.2 — Create Docker Compose

Create docker-compose.yml:
- backend (port 5000), frontend (port 3000), ai-service (port 8000), postgres (5432), redis (6379)
- Volumes, env vars, networking

---

### Task 24.3 — Create CI/CD Pipeline

.github/workflows/ci.yml: On PR → run tests, lint, build.

.github/workflows/deploy.yml: On merge → build images, push registry, deploy, migrate, health check.

---

### Task 24.4 — Provision Production Infrastructure

Database: managed PostgreSQL. Hosting: container service. Redis: managed instance. SSL, domains, env vars in secret manager.

---

### Task 24.5 — Create Environment Configs

.env.development, .env.staging, .env.production — each with DB, API URLs, feature flags, log levels.

---

### Task 24.6 — Create Public Status Page

**Frontend**

Create app/status/page.tsx (no auth):
- System status: operational / degraded / down
- Component statuses
- Uptime percentage
- Incident history

---

## Task 25 — Documentation

---

### Task 25.1 — Configure Swagger/OpenAPI

**Backend**

Full Swagger config: all endpoints documented, schemas, auth methods, error formats, examples.

---

### Task 25.2 — Complete API Docs Page

**Frontend**

Update app/docs/page.tsx: full endpoint reference, auth guide, webhook guide, error codes, rate limits, changelog.

---

### Task 25.3 — Create SDK Examples Page

**Frontend**

Create app/docs/sdks/page.tsx: cURL, JavaScript, Python, C# examples for all endpoints. Webhook verification samples.

---

### Task 25.4 — Create User Guides Page

**Frontend**

Create app/docs/guides/page.tsx: getting started, bulk upload guide (sample CSV download), webhook integration, recurring payments, wallet management.

---

### Task 25.5 — Write Internal Documentation

Create markdown files:
- ARCHITECTURE.md — system overview
- DATABASE.md — schema docs
- LOCAL_SETUP.md — dev setup
- DEPLOYMENT.md — deploy process
- TROUBLESHOOTING.md — common issues

---

---

# Complete Task Index

| Phase | Task | Sub-tasks | Description |
|-------|------|-----------|-------------|
| 1 | 1 | 1.1–1.8 | Database & Models Restructure |
| 1 | 2 | 2.1–2.6 | API Response & Error Handling |
| 1 | 3 | 3.1–3.8 | Organization System |
| 1 | 4 | 4.1–4.6 | Bank Registry System |
| 1 | 5 | 5.1–5.7 | AI Bank Normalization |
| 1 | 6 | 6.1–6.9 | Bulk Payment Upload |
| 1 | 7 | 7.1–7.8 | Transaction Processing Engine |
| 1 | 8 | 8.1–8.5 | Payout & API Key Update |
| 1 | 9 | 9.1–9.7 | Notification System |
| 1 | 10 | 10.1–10.7 | Testing |
| 2 | 11 | 11.1–11.5 | Public Developer API |
| 2 | 12 | 12.1–12.7 | Webhook System |
| 2 | 13 | 13.1–13.5 | Reports & Export |
| 2 | 14 | 14.1–14.4 | Email Notifications |
| 3 | 15 | 15.1–15.6 | Payment Provider Integration |
| 3 | 16 | 16.1–16.7 | Wallet System |
| 3 | 17 | 17.1–17.6 | Recurring Payments |
| 4 | 18 | 18.1–18.5 | Analytics Dashboard |
| 4 | 19 | 19.1–19.5 | Advanced AI Normalization |
| 4 | 20 | 20.1–20.6 | Audit & Compliance |
| 5 | 21 | 21.1–21.6 | Security Hardening |
| 5 | 22 | 22.1–22.4 | Performance Optimization |
| 5 | 23 | 23.1–23.5 | Monitoring & Logging |
| 5 | 24 | 24.1–24.6 | DevOps & Deployment |
| 5 | 25 | 25.1–25.5 | Documentation |

**Total: 25 Tasks → 148 Sub-tasks across 5 Phases**

---

# Execution Rules

1. Work on sub-tasks one at a time in order.
2. Each sub-task must be complete and working before moving to the next.
3. Within a task, sub-tasks are sequential (each builds on previous).
4. Tasks within a phase are sequential (Task 1 before Task 2).
5. Never skip phases. Phase 1 must be stable before Phase 2 begins.
6. Every sub-task that touches backend must have its frontend counterpart within the same task.
7. Test as you go — don't wait for Task 10 to verify things work.

---

# Guiding Principle

Small steps. Working software at every step. No half-built features.

Complete one sub-task. Verify it works. Move to the next.
