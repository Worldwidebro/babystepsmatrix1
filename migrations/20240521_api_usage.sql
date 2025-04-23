-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can view all usage"
    ON api_usage
    FOR SELECT
    USING (auth.role() = 'admin');

CREATE POLICY "Admin can insert usage"
    ON api_usage
    FOR INSERT
    WITH CHECK (auth.role() = 'admin');

CREATE POLICY "Admin can update usage"
    ON api_usage
    FOR UPDATE
    USING (auth.role() = 'admin');

-- Create trigger for updated_at
CREATE TRIGGER update_api_usage_updated_at
    BEFORE UPDATE ON api_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_api_usage_service ON api_usage(service);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON api_usage(created_at); 