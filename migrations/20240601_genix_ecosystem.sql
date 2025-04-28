-- Genix Ecosystem Database Initialization

-- Users table for Genix ecosystem
CREATE TABLE IF NOT EXISTS genix_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    plan VARCHAR(50) DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credit repair disputes table
CREATE TABLE IF NOT EXISTS credit_disputes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES genix_users(id),
    issue TEXT NOT NULL,
    letter TEXT NOT NULL,
    payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job search subscriptions table
CREATE TABLE IF NOT EXISTS job_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES genix_users(id),
    resume TEXT,
    status VARCHAR(50) DEFAULT 'active',
    subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job search results table
CREATE TABLE IF NOT EXISTS job_results (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES job_subscriptions(id),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    description TEXT,
    url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transactions table for payment tracking
CREATE TABLE IF NOT EXISTS genix_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES genix_users(id),
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    payment_id VARCHAR(255),
    product_type VARCHAR(50) NOT NULL, -- 'credit_repair' or 'job_subscription'
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI usage tracking
CREATE TABLE IF NOT EXISTS ai_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES genix_users(id),
    provider VARCHAR(50) NOT NULL, -- 'claude' or 'gemini'
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    cost NUMERIC(10, 6) DEFAULT 0, -- Cost in USD
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);