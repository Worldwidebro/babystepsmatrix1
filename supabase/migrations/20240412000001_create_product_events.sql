-- Create product events table
CREATE TABLE IF NOT EXISTS public.product_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS product_events_listing_id_idx ON public.product_events (listing_id);
CREATE INDEX IF NOT EXISTS product_events_event_type_idx ON public.product_events (event_type);
CREATE INDEX IF NOT EXISTS product_events_timestamp_idx ON public.product_events (timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.product_events
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.product_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create materialized view for daily metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS product_daily_metrics AS
SELECT
    date_trunc('day', timestamp) AS date,
    listing_id,
    COUNT(*) FILTER (WHERE event_type = 'view') AS views,
    COUNT(*) FILTER (WHERE event_type = 'purchase') AS purchases,
    SUM((data->>'amount')::float) FILTER (WHERE event_type = 'purchase') AS revenue
FROM product_events
GROUP BY date_trunc('day', timestamp), listing_id;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS product_daily_metrics_date_listing_idx 
ON product_daily_metrics (date, listing_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_product_daily_metrics()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_daily_metrics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
CREATE TRIGGER refresh_product_daily_metrics_trigger
AFTER INSERT OR UPDATE OR DELETE ON product_events
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_product_daily_metrics(); 