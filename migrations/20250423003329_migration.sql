-- Create voice_cache table
CREATE TABLE IF NOT EXISTS voice_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    text_hash TEXT NOT NULL,
    audio BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index on text_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_voice_cache_text_hash ON voice_cache(text_hash);
