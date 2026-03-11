# Forge APIs — Project Context & Development Guide

## 1. Vision

Forge APIs is a developer-first financial infrastructure platform that enables businesses and developers to automate payments and bulk payouts through simple APIs.

The goal of Forge is to remove the complexity of financial integrations by providing a reliable system that allows applications to move money programmatically.

Instead of companies building their own payment infrastructure, they can integrate Forge and instantly gain the ability to:

* Send bulk payments
* Automate payouts
* Normalize banking data
* Track financial transactions
* Build payment workflows inside their applications

Forge aims to become the infrastructure layer for payment automation, especially for businesses that need to process large numbers of transactions.

---

# 2. Problem We Are Solving

Many organizations struggle with bulk payments because:

* Bank names are inconsistent
* Payment data is messy
* Bulk payouts require manual processing
* Existing systems are complex or unreliable
* Developers lack simple APIs for payouts

Example problems:

User uploads CSV:

Name | Bank | Account
John | UBA | 000111222
Mary | UBA PLC | 000333444
David | United Bnk Afr | 000555666

All of these represent the same bank but systems fail to detect that.

Forge solves this with **AI-powered bank normalization** and a **reliable payout engine**.

---

# 3. Core Product Focus (MVP)

The first version of Forge focuses on one powerful feature:

## Bulk Payment Infrastructure

Organizations can upload payment data or call an API to send large numbers of payments.

Forge processes the data, normalizes bank information, validates accounts, and executes payouts.

Primary users include:

* Startups
* Payroll systems
* NGOs
* Marketplaces
* Gig platforms
* Financial services companies

---

# 4. Key Product Capabilities

## 4.1 Bulk Payment Processing

Users can upload a CSV file containing:

Name
Bank
Account Number
Amount

The system will:

1. Parse the file
2. Normalize bank names
3. Validate data
4. Create payout jobs
5. Process payments
6. Track transaction results

---

## 4.2 AI Bank Normalization

Forge uses AI-assisted normalization to standardize bank names.

Example:

Input:

UBA
UBA PLC
United Bnk Afr

Output:

United Bank for Africa

This is done using:

* Text normalization
* Embeddings
* Similarity search
* Bank registry database

This reduces payment errors significantly.

---

## 4.3 Transaction Engine

The backend processes payouts as jobs.

Each bulk upload creates:

Payout Batch → Individual Transactions

The system processes them asynchronously.

Benefits:

* Scalable
* Fault tolerant
* Easy retry system
* Transaction tracking

---

## 4.4 Developer API

Forge exposes REST APIs for developers.

Example capabilities:

Create payouts
Upload payment batches
Check transaction status
Manage API keys
Retrieve payment history

This allows applications to integrate Forge directly.

---

## 4.5 Dashboard

Organizations access Forge through a web dashboard where they can:

Upload payment files
View payout batches
Monitor transactions
Manage API keys
Download reports

The dashboard is the control center for the platform.

---

# 5. System Architecture

Forge consists of four main layers.

## Frontend

Purpose: User interface for businesses.

Main features:

Dashboard
Bulk upload interface
Transaction monitoring
API key management

Technology:

React / Next.js

---

## Backend API

Purpose: Core business logic.

Responsibilities:

Authentication
Payment processing
Bank normalization
Transaction management
API access

Technology:

ASP.NET Core

---

## AI Normalization Service

Purpose:

Standardize bank names using embeddings and similarity matching.

Responsibilities:

Bank name normalization
Alias detection
Fuzzy matching
Similarity scoring

Technology:

Python service using sentence-transformers

---

## Database

Purpose:

Store platform data.

Main tables include:

Users
Organizations
API Keys
Banks
Bank Aliases
Payout Batches
Transactions

Technology:

PostgreSQL

---

# 6. System Workflow

Bulk Payment Flow

User uploads CSV
↓
System parses file
↓
AI normalization resolves bank names
↓
System validates accounts
↓
Payout batch is created
↓
Transactions are generated
↓
Payment engine processes payouts
↓
Results stored and displayed in dashboard

---

# 7. Key Principles of the Platform

Forge must prioritize:

Reliability
Accuracy
Developer experience
Scalability
Simple integrations

The platform should feel:

Fast
Clean
Predictable
Developer-friendly

---

# 8. MVP Development Focus

Current development priority:

Bulk payment upload
Bank normalization
Transaction engine
Dashboard monitoring
Developer API

Features that will come later:

Wallet infrastructure
Payment collections
Multi-country support
Advanced analytics
Payment routing

---

# 9. Long-Term Vision

Forge aims to become a global payment infrastructure platform.

Future capabilities may include:

Global payouts
Multi-currency wallets
Payment orchestration
Card issuing
Payment routing

Forge will evolve from a bulk payment tool into a full financial infrastructure platform for developers.

---

# 10. Development Guidelines

When building Forge:

Keep architecture simple
Focus on reliability over complexity
Build features that support bulk payments first
Ensure APIs are clean and well documented
Avoid unnecessary abstractions in the MVP stage

The goal is to build a working, scalable infrastructure that can grow into a full fintech platform.

---

# 11. Current Status

The project currently includes:

Landing page
Initial backend structure
Project architecture design

Next development steps:

Implement bulk upload processing
Build bank normalization system
Create payout batch system
Implement transaction engine
Build dashboard transaction views
