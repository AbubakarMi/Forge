# Forge APIs — Product Roadmap

## Purpose

This document defines the development roadmap for Forge APIs.
It outlines the phases required to build the platform from MVP to a full financial infrastructure product.

All development work should follow this roadmap to ensure the project progresses logically and focuses on the most important features first.

Forge's initial focus is **bulk payment infrastructure with AI-powered bank normalization**.

---

# Phase 1 — MVP Foundation

Goal: Build the core infrastructure required to process bulk payments.

This phase focuses on building a working system that allows organizations to upload payment data and process payouts.

Key deliverables:

User authentication system
Organization management
Bank registry database
Bulk payment upload system
Bank normalization system
Payout batch engine
Transaction processing system
Basic dashboard

---

# Feature 1 — Authentication System

Users must be able to:

Register an account
Login securely
Access their organization dashboard

Requirements:

JWT-based authentication
Secure password hashing
Organization-level data isolation

Key API endpoints:

POST /auth/register
POST /auth/login
GET /auth/profile

---

# Feature 2 — Organization System

Each user belongs to an organization.

Organizations represent businesses using Forge.

Organizations must support:

Organization creation
Member management
API key management

Database entities:

Users
Organizations
OrganizationMembers

---

# Feature 3 — Bank Registry

Forge must maintain a reliable list of banks.

The system must store:

Bank name
Bank code
Country
Aliases

Database tables:

Banks
BankAliases

Example:

Bank: United Bank for Africa
Aliases: UBA, UBA PLC, United Bnk Afr

---

# Feature 4 — Bulk Payment Upload

Users must be able to upload CSV files containing payment instructions.

Example file format:

Name
Bank
Account Number
Amount

System responsibilities:

Parse the CSV file
Validate records
Normalize bank names
Create payout batch

API endpoint:

POST /payout-batches/upload

---

# Feature 5 — AI Bank Normalization

Forge must normalize bank names automatically.

Example inputs:

UBA
UBA PLC
United Bnk Afr

Expected output:

United Bank for Africa

Normalization process:

Text preprocessing
Embedding generation
Similarity matching
Confidence scoring

The system should return the most probable bank match.

---

# Feature 6 — Payout Batch Engine

When a CSV file is uploaded, a payout batch must be created.

Each batch contains multiple transactions.

Example:

Batch ID: 1001

Transactions:

Transaction 1
Transaction 2
Transaction 3

Batch statuses:

Pending
Processing
Completed
Failed

---

# Feature 7 — Transaction Processing System

Each payout instruction becomes a transaction.

Transaction fields:

Recipient name
Bank
Account number
Amount
Status
Timestamp

Transaction statuses:

Pending
Processing
Completed
Failed

The system must support retry logic for failed transactions.

---

# Feature 8 — Dashboard

Organizations need a dashboard to manage their payments.

Dashboard features:

Upload payment files
View payout batches
View transaction history
Download reports

Important views:

Dashboard overview
Batch details page
Transaction table

---

# Phase 2 — Developer Platform

Goal: Turn Forge into a developer-friendly API platform.

Developers should be able to integrate Forge directly into their applications.

Key features:

Developer API
API key system
Webhook notifications
API documentation

Example API endpoints:

POST /payout-batches
GET /transactions
GET /payout-batches/{id}

---

# Phase 3 — Payment Infrastructure Expansion

After the MVP is stable, Forge should expand its capabilities.

Future features include:

Wallet infrastructure
Automated payouts
Recurring payments
Multi-currency support
Global bank registry

---

# Phase 4 — Platform Intelligence

Introduce smarter automation and analytics.

Features:

Payment analytics
Fraud detection
Advanced AI normalization
Data insights for organizations

---

# Phase 5 — Global Financial Infrastructure

Long-term vision for Forge.

Capabilities may include:

Global payouts
Payment orchestration
Card issuing infrastructure
Cross-border payments
Financial APIs for developers

Forge should evolve into a full **financial infrastructure platform for developers worldwide**.

---

# Current Development Priority

The immediate focus is Phase 1.

The most important systems to build first are:

Bulk payment upload
Bank normalization
Payout batch engine
Transaction tracking
Basic dashboard

All development efforts should focus on completing these systems before adding additional features.

---

# Guiding Principle

Forge must solve one problem exceptionally well:

**Reliable and intelligent bulk payment processing.**

Once that foundation is strong, the platform can expand into a broader financial infrastructure ecosystem.
