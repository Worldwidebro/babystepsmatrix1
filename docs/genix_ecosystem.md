# Genix Business Ecosystem

A comprehensive AI-powered business ecosystem that integrates with the BabyStepsMatrix platform. This implementation provides monetizable AI products through a unified architecture.

## Overview

The Genix Business Ecosystem is a complete implementation of an AI-driven business platform that includes:

- **AI Meta-Wrapper**: Smart routing between Claude and Gemini models
- **Business Modules**: Ready-to-monetize products (Credit Repair, Job Search)
- **Database Integration**: Supabase and Neon Postgres for data persistence
- **Payment Processing**: Stripe integration for monetization
- **Automation Engine**: Workflow automation for business processes

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Flask Application                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌──────────┐ │
│  │ Credit      │    │ AI Boss Hub │    │ Genix    │ │
│  │ Repair API  │    │ Job Search  │    │ Banks    │ │
│  └─────────────┘    └─────────────┘    └──────────┘ │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │             AI Orchestrator                 │    │
│  │  ┌─────────────┐        ┌─────────────┐    │    │
│  │  │   Claude    │        │   Gemini    │    │    │
│  │  └─────────────┘        └─────────────┘    │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │           Automation Engine (IZA OS)        │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
      │               │                │         │
      ▼               ▼                ▼         ▼
┌──────────┐    ┌─────────┐     ┌──────────┐  ┌─────────┐
│ Supabase │    │ Neon DB │     │  Stripe  │  │  Redis  │
└──────────┘    └─────────┘     └──────────┘  └─────────┘
```

## Business Modules

### 1. Credit Repair ($99/letter)

Automated credit dispute letter generation using AI:

- Analyzes user's credit issues
- Researches relevant FCRA laws
- Generates professional dispute letters
- Processes payment via Stripe

### 2. AI Boss Hub ($29/mo subscription)

AI-powered job search and career assistance:

- Analyzes user's resume
- Finds matching job opportunities
- Provides application recommendations
- Subscription-based recurring revenue

## Integration Points

### 1. AI Boss Hub Integration

The Genix ecosystem extends the existing AI Boss Hub with job search capabilities:

- Resume analysis
- Job matching
- Career recommendations
- Subscription management

### 2. Genix Banks Integration

Integrates with Genix Banks for financial operations:

```json
{
  "endpoints": {
    "transactions": "/genix/api/v1/transactions",
    "accounts": "/genix/api/v1/accounts",
    "risk": "/genix/api/v1/risk"
  },
  "events": {
    "transaction_processed": "genix.transaction.processed",
    "risk_alert": "genix.risk.alert"
  }
}
```

### 3. IZA OS Integration

Leverages the IZA OS automation engine for workflow management:

- User onboarding
- Payment processing
- Subscription management
- Service delivery

## API Endpoints

### Credit Repair

```
POST /genix/api/credit-repair
Content-Type: application/json

{
  "issue": "Description of the credit issue to dispute"
}
```

### Job Search

```
POST /genix/api/job-search
Content-Type: application/json

{
  "resume": "Full resume text or key skills/experience"
}
```

### System Status

```
GET /genix/api/status
```

## Setup and Deployment

### Environment Variables

The following environment variables are required:

```
STRIPE_KEY=your_stripe_api_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
CLAUDE_KEY=your_claude_api_key
GEMINI_KEY=your_gemini_api_key
REDIS_URL=your_redis_url
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
NEON_HOST=your_neon_host
NEON_DB=your_neon_db_name
NEON_USER=your_neon_username
NEON_PW=your_neon_password
```

### Initialization

The Genix ecosystem can be initialized using the provided scripts:

```bash
# Initialize the entire ecosystem
python scripts/init_genix.py

# Test the ecosystem components
python scripts/test_genix.py

# Start the Flask application
python src/app.py
```

## Implementation Roadmap

### Week 1: MVP Products

- [x] Credit Repair API (Flask endpoint)
- [x] Stripe Integration (test mode)

### Week 2: Core Infrastructure

- [x] Neon Postgres tables (users, transactions)
- [x] Supabase Auth (email/password)

### Month 1+: Scale

- [ ] Add Redis caching
- [ ] Deploy AI meta-wrapper
- [ ] Connect n8n/Make.com workflows

## Security Considerations

- All API keys stored as environment variables
- Stripe webhook verification prevents tampering
- Database connections use secure credentials
- User authentication through Supabase
