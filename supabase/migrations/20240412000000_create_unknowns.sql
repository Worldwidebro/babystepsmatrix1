-- Create unknowns table
CREATE TABLE IF NOT EXISTS public.unknowns (
    id UUID PRIMARY KEY,
    company_id TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    potential_impact FLOAT NOT NULL CHECK (potential_impact >= 0 AND potential_impact <= 1),
    discovery_date TIMESTAMP WITH TIME ZONE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL,
    related_companies JSONB NOT NULL DEFAULT '[]',
    exploration_status TEXT NOT NULL CHECK (exploration_status IN ('new', 'investigating', 'resolved')),
    tags JSONB NOT NULL DEFAULT '[]',
    lovabl_listing_id TEXT,
    lovabl_last_sync TIMESTAMP WITH TIME ZONE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS unknowns_company_id_idx ON public.unknowns (company_id);
CREATE INDEX IF NOT EXISTS unknowns_potential_impact_idx ON public.unknowns (potential_impact);
CREATE INDEX IF NOT EXISTS unknowns_exploration_status_idx ON public.unknowns (exploration_status);
CREATE INDEX IF NOT EXISTS unknowns_lovabl_listing_id_idx ON public.unknowns (lovabl_listing_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.unknowns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.unknowns
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.unknowns
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.unknowns
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create function for full-text search
CREATE OR REPLACE FUNCTION unknowns_search(search_term TEXT)
RETURNS SETOF unknowns AS $$
    SELECT *
    FROM unknowns
    WHERE
        to_tsvector('english', description) @@ plainto_tsquery('english', search_term)
        OR to_tsvector('english', category) @@ plainto_tsquery('english', search_term)
$$ LANGUAGE sql STABLE; 