-- Create price experiments table
CREATE TABLE IF NOT EXISTS public.price_experiments (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    variants JSONB NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
    winning_variant_id TEXT,
    confidence_level FLOAT
);

-- Create experiment events table
CREATE TABLE IF NOT EXISTS public.experiment_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id TEXT NOT NULL REFERENCES public.price_experiments(id),
    variant_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'conversion')),
    data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS price_experiments_listing_id_idx ON public.price_experiments (listing_id);
CREATE INDEX IF NOT EXISTS price_experiments_status_idx ON public.price_experiments (status);
CREATE INDEX IF NOT EXISTS experiment_events_experiment_id_idx ON public.experiment_events (experiment_id);
CREATE INDEX IF NOT EXISTS experiment_events_variant_id_idx ON public.experiment_events (variant_id);
CREATE INDEX IF NOT EXISTS experiment_events_timestamp_idx ON public.experiment_events (timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE public.price_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.price_experiments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.price_experiments
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.price_experiments
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON public.experiment_events
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.experiment_events
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create materialized view for experiment metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS experiment_metrics AS
SELECT
    e.id as experiment_id,
    e.listing_id,
    v->>'id' as variant_id,
    v->>'price_tiers' as price_tiers,
    COUNT(*) FILTER (WHERE ee.event_type = 'view') as views,
    COUNT(*) FILTER (WHERE ee.event_type = 'conversion') as conversions,
    SUM((ee.data->>'amount')::float) FILTER (WHERE ee.event_type = 'conversion') as revenue,
    CASE 
        WHEN COUNT(*) FILTER (WHERE ee.event_type = 'view') > 0 
        THEN (COUNT(*) FILTER (WHERE ee.event_type = 'conversion')::float / 
              COUNT(*) FILTER (WHERE ee.event_type = 'view')) * 100
        ELSE 0
    END as conversion_rate
FROM public.price_experiments e
CROSS JOIN JSONB_ARRAY_ELEMENTS(e.variants) as v
LEFT JOIN public.experiment_events ee 
    ON ee.experiment_id = e.id 
    AND ee.variant_id = v->>'id'
GROUP BY e.id, e.listing_id, v->>'id', v->>'price_tiers';

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS experiment_metrics_experiment_variant_idx 
ON experiment_metrics (experiment_id, variant_id);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_experiment_metrics()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY experiment_metrics;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
CREATE TRIGGER refresh_experiment_metrics_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.experiment_events
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_experiment_metrics(); 