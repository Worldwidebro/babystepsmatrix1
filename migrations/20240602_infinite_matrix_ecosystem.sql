-- Infinite Matrix Ecosystem Database Initialization

-- Users table for Infinite Matrix ecosystem
CREATE TABLE IF NOT EXISTS infinite_matrix_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'contractor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tool catalog table
CREATE TABLE IF NOT EXISTS tools (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    api_endpoint VARCHAR(512),
    icon_url VARCHAR(512),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES infinite_matrix_users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow steps table
CREATE TABLE IF NOT EXISTS workflow_steps (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    tool_id INTEGER REFERENCES tools(id),
    step_order INTEGER NOT NULL,
    config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tool usage analytics
CREATE TABLE IF NOT EXISTS tool_usage (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES infinite_matrix_users(id),
    tool_id INTEGER REFERENCES tools(id),
    workflow_id INTEGER REFERENCES workflows(id),
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subscriptions table for payment tracking
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES infinite_matrix_users(id),
    plan VARCHAR(50) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    status VARCHAR(50) DEFAULT 'active',
    stripe_subscription_id VARCHAR(255),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial tool categories
INSERT INTO tools (name, category, description) VALUES
('GoDaddy', 'Website Builders', 'Website building and hosting platform'),
('Webflow', 'Website Builders', 'Visual web design platform'),
('Framer', 'Website Builders', 'Interactive design and prototyping tool'),
('Make.com', 'Automation', 'Workflow automation platform'),
('Zapier', 'Automation', 'App integration and workflow automation'),
('UiPath', 'Automation', 'Robotic process automation platform'),
('Meta Llama 4', 'AI', 'Large language model by Meta'),
('Azure OpenAI', 'AI', 'Microsoft Azure OpenAI service'),
('Hugging Face', 'AI', 'AI model repository and deployment platform'),
('Stripe', 'Payments', 'Online payment processing platform'),
('PayPal', 'Payments', 'Digital payment platform'),
('Square', 'Payments', 'Payment and point-of-sale solutions');