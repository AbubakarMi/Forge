# Task 14 — Frontend Testing Guide

Test everything through the browser at `http://localhost:4000`. Backend runs at `http://localhost:5000`.

---

## Prerequisites

1. **Start the backend:**
   ```bash
   cd backend/forge-api
   dotnet run
   ```

2. **Start the frontend:**
   ```bash
   cd frontend/forge-dashboard
   npm run dev
   ```

3. **Configure SMTP** in `backend/forge-api/appsettings.json` (for email tests):
   ```json
   "SmtpSettings": {
     "Host": "smtp.gmail.com",
     "Port": 587,
     "Username": "your-email@gmail.com",
     "Password": "your-app-password",
     "FromEmail": "noreply@forgeapi.com",
     "FromName": "Forge API",
     "UseSsl": true,
     "Enabled": true
   }
   ```
   Or use **MailHog** for local testing: `Host: "localhost"`, `Port: 1025`, `UseSsl: false`

4. **Configure Encryption** in `appsettings.json`:
   ```json
   "EncryptionSettings": {
     "Key": "<base64-encoded-32-byte-key>"
   }
   ```

---

## Test 1 — App Startup

| Step | What to do | Expected |
|------|-----------|----------|
| 1 | Run `dotnet run` in backend | App starts without errors |
| 2 | Run `npm run dev` in frontend | Next.js starts on port 4000 |
| 3 | Open `http://localhost:4000` | Landing page loads |

---

## Test 2 — Registration Email

| Step | What to do | Expected |
|------|-----------|----------|
| 1 | Go to `http://localhost:4000/register` | Registration page loads |
| 2 | Register a new user | Registration succeeds |
| 3 | Check your email inbox (or MailHog UI at `localhost:8025`) | Welcome email received with your name and Forge branding |

**What to verify in the email:**
- [ ] Forge logo/branding in header
- [ ] Your name appears correctly
- [ ] Has a CTA button
- [ ] Footer with copyright
- [ ] No broken HTML

---

## Test 3 — Data Masking on Transactions Page

| Step | What to do | Expected |
|------|-----------|----------|
| 1 | Log in and go to **Dashboard > Transactions** | Transactions page loads |
| 2 | Look at account numbers in the transaction list | Account numbers show as `******7890` (last 4 digits only) |
| 3 | Click on a single transaction to view details | Account number is still masked |

**What to verify:**
- [ ] No full account numbers visible anywhere
- [ ] Masking format is `******XXXX` (last 4 shown)
- [ ] Page loads without errors

---

## Test 4 — Data Masking on Payout Batches

| Step | What to do | Expected |
|------|-----------|----------|
| 1 | Go to **Dashboard > Payout Batches** | Batches list loads |
| 2 | Click on a batch to see its transactions | Batch detail page loads |
| 3 | Check account numbers in the batch transactions | All masked as `******XXXX` |

**What to verify:**
- [ ] Batch transactions show masked account numbers
- [ ] Batch summary stats display correctly
- [ ] No errors in browser console

---

## Test 5 — Bulk Upload with Email Notifications

This is the main integration test. It tests batch processing + email notifications + data masking together.

| Step | What to do | Expected |
|------|-----------|----------|
| 1 | Go to **Dashboard > Bulk Upload** | Upload page loads |
| 2 | Upload a CSV with some valid and some invalid transactions | Upload succeeds, batch created |
| 3 | Go to **Payout Batches** and find your batch | Batch shows with status |
| 4 | Wait for processing to complete | Status changes to `completed` or `partially_failed` |
| 5 | Check your email | Batch completion/failure email received |

**What to verify in the email:**
- [ ] Shows file name and total records
- [ ] Shows success/failed count
- [ ] Shows total amount with ₦ symbol
- [ ] Account numbers in email are NOT in plaintext
- [ ] If some transactions failed, you get a failure alert email too

---

## Test 6 — Settings Page

| Step | What to do | Expected |
|------|-----------|----------|
| 1 | Click **Settings** in the sidebar | Settings page loads |
| 2 | Check the Profile section | Your email is displayed |
| 3 | Check notification toggles | 4 toggles visible with correct defaults |
| 4 | Toggle each switch on/off | Visual state changes smoothly |
| 5 | Click **Save** | Shows success feedback |

**Default toggle states:**
| Toggle | Default |
|--------|---------|
| Email on batch completed | ON |
| Email on batch failed | ON |
| Email on failed transactions | OFF |
| Weekly summary email | ON |

**Note:** Save is currently simulated (backend endpoint not built yet). Just verify the UI works.

---

## Test 7 — Request Logging (Check Backend Console)

While doing any of the above tests, watch the backend console output.

| What to check | Expected |
|---------------|----------|
| Each request logged | Shows: method, path, status code, duration |
| Correlation ID | Each log line includes a correlation ID |
| Authorization header | Shows `[REDACTED]`, NOT the actual token |
| API key header | Shows `[REDACTED]`, NOT the actual key |
| Response headers | Browser DevTools > Network tab > any request > Response Headers should show `X-Correlation-Id` |

**How to check correlation ID in browser:**
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Make any action (load a page, click something)
4. Click on any API request to `localhost:5000`
5. Check **Response Headers** for `X-Correlation-Id`

---

## Test 8 — Error Resilience

| Step | What to do | Expected |
|------|-----------|----------|
| 1 | Set `SmtpSettings:Enabled` to `false` in appsettings.json | |
| 2 | Restart backend | App starts normally |
| 3 | Do a bulk upload and process a batch | Batch processes successfully, no crash |
| 4 | Check backend console | Log says email sending is disabled, no errors |

This verifies the app doesn't crash when email is disabled.

---

## Quick Checklist

Run through these as a final pass:

- [ ] App builds and starts (both frontend and backend)
- [ ] Can register and login
- [ ] Transactions page shows masked account numbers
- [ ] Payout batch detail shows masked account numbers
- [ ] Bulk upload works and triggers email notifications
- [ ] Emails have correct Forge branding and content
- [ ] Settings page loads with working toggles
- [ ] Settings link exists in sidebar
- [ ] Backend console shows structured logs (no sensitive data leaked)
- [ ] Browser DevTools shows `X-Correlation-Id` in response headers
- [ ] App doesn't crash when SMTP is disabled

---

## Bugs Found

Use this section to track any issues you find:

| # | Page/Feature | Bug Description | Status |
|---|-------------|-----------------|--------|
| 1 | | | |
| 2 | | | |
| 3 | | | |

---

## After Testing

Once all checks pass and bugs are fixed, we move to **Task 15 — Payment Provider Integration**.
