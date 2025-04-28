# Genix Business Ecosystem

A comprehensive AI-powered business ecosystem built for Replit deployment. This implementation integrates AI services, database connections, and payment processing to create monetizable AI products.

## Architecture Overview

The Genix Business Ecosystem consists of the following components:

1. **Core Infrastructure**

   - Flask application with RESTful API endpoints
   - Integration with Supabase, Neon Postgres, and Redis
   - Stripe payment processing

2. **AI Meta-Wrapper**

   - Smart routing between Claude and Gemini AI models
   - Cost-aware provider selection
   - Response caching for efficiency

3. **Business Modules**

   - Credit Repair ($99/letter automated product)
   - AI Boss Hub ($29/mo job search subscription)

4. **Automation Engine (IZA OS)**
   - User onboarding workflow
   - Subscription management
   - Payment processing

## Setup Instructions

### Prerequisites

- Python 3.8+
- Flask
- Supabase account
- Neon Postgres database
- Stripe account (for payments)
- API keys for Claude and Gemini (optional but recommended)

### Environment Variables

Set the following environment variables in your Replit Secrets or `.env` file:

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

### Database Setup

Run the migration script to create the necessary database tables:

```bash
psql -h $NEON_HOST -d $NEON_DB -U $NEON_USER -f migrations/20240601_genix_ecosystem.sql
```

## API Endpoints

### Credit Repair

**Endpoint:** `/genix/api/credit-repair`
**Method:** POST
**Payload:**

```json
{
  "issue": "Description of the credit issue to dispute"
}
```

**Response:**

```json
{
  "letter": "Generated dispute letter content",
  "payment_id": "stripe_payment_intent_id"
}
```

### Job Search

**Endpoint:** `/genix/api/job-search`
**Method:** POST
**Payload:**

```json
{
  "resume": "Full resume text or key skills/experience"
}
```

**Response:**

```json
[
  {
    "title": "Job Title",
    "company": "Company Name",
    "description": "Job Description",
    "url": "Application URL"
  }
]
```

### System Status

**Endpoint:** `/genix/api/status`
**Method:** GET
**Response:**

```json
{
  "stripe": "available",
  "claude": "available",
  "gemini": "available",
  "redis": "available",
  "supabase": "available",
  "postgres": "available"
}
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

## Integration with Existing Systems

The Genix Business Ecosystem integrates with the following components of the BabyStepsMatrix platform:

- **AI Boss Hub**: Provides job search functionality and resume analysis
- **Genix Banks**: Handles financial operations and transaction processing
- **IZA OS**: Manages automation workflows and business processes

## Error Handling

The system includes robust error handling for:

- Missing API keys or services
- Invalid input data
- AI provider failures (with automatic retries)
- Payment processing issues

## Security Considerations

- All API keys are stored as environment variables
- Stripe webhook verification prevents tampering
- Database connections use secure credentials
- User authentication through Supabase
