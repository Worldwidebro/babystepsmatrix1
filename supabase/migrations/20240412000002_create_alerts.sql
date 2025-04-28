-- Create alert rules table
CREATE TABLE IF NOT EXISTS public.alert_rules (
    id TEXT PRIMARY KEY,
    metric TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('<', '>', '=')),
    threshold FLOAT NOT NULL,
    window_minutes INTEGER NOT NULL,
    cooldown_minutes INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_triggered TIMESTAMP WITH TIME ZONE
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
    id TEXT PRIMARY KEY,
    rule_id TEXT NOT NULL REFERENCES public.alert_rules(id),
    metric TEXT NOT NULL,
    value FLOAT NOT NULL,
    threshold FLOAT NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS alert_rules_metric_idx ON public.alert_rules (metric);
CREATE INDEX IF NOT EXISTS alerts_rule_id_idx ON public.alerts (rule_id);
CREATE INDEX IF NOT EXISTS alerts_triggered_at_idx ON public.alerts (triggered_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.alert_rules
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.alert_rules
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.alert_rules
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable read access for authenticated users" ON public.alerts
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.alerts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Create materialized view for alert summaries
CREATE MATERIALIZED VIEW IF NOT EXISTS alert_summaries AS
SELECT
    metric,
    COUNT(*) as total_alerts,
    COUNT(*) FILTER (WHERE triggered_at >= NOW() - INTERVAL '24 hours') as alerts_24h,
    MAX(triggered_at) as last_alert,
    AVG(value) as avg_value
FROM public.alerts
GROUP BY metric;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS alert_summaries_metric_idx 
ON alert_summaries (metric);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_alert_summaries()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY alert_summaries;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh materialized view
CREATE TRIGGER refresh_alert_summaries_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.alerts
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_alert_summaries(); 