-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create Languages table
CREATE TABLE IF NOT EXISTS languages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Voice Categories table
CREATE TABLE IF NOT EXISTS voice_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Voice Talents table with PostGIS support
CREATE TABLE IF NOT EXISTS voice_talents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR NOT NULL,
    language_id UUID REFERENCES languages(id),
    category_id UUID REFERENCES voice_categories(id),
    accent VARCHAR,
    description TEXT,
    sample_url VARCHAR,
    hourly_rate DECIMAL(10,2) NOT NULL,
    lat DECIMAL(10,6) NOT NULL,
    lng DECIMAL(10,6) NOT NULL,
    location GEOGRAPHY(POINT) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    voice_talent_id UUID REFERENCES voice_talents(id),
    client_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_voice_talents_language ON voice_talents(language_id);
CREATE INDEX IF NOT EXISTS idx_voice_talents_category ON voice_talents(category_id);
CREATE INDEX IF NOT EXISTS idx_voice_talents_location ON voice_talents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_reviews_voice_talent ON reviews(voice_talent_id);

-- Helper function to find voice talents within radius
CREATE OR REPLACE FUNCTION find_voice_talents_within_radius(
    center_lat DECIMAL,
    center_lng DECIMAL,
    radius_km DECIMAL
) RETURNS TABLE (
    id UUID,
    name VARCHAR,
    language_name VARCHAR,
    category_name VARCHAR,
    accent VARCHAR,
    hourly_rate DECIMAL,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        vt.id,
        vt.name,
        l.name as language_name,
        vc.name as category_name,
        vt.accent,
        vt.hourly_rate,
        ST_Distance(vt.location, ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography) / 1000 as distance_km
    FROM voice_talents vt
    JOIN languages l ON vt.language_id = l.id
    JOIN voice_categories vc ON vt.category_id = vc.id
    WHERE ST_DWithin(
        vt.location,
        ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get voice talent statistics by region
CREATE OR REPLACE FUNCTION get_voice_talent_stats_by_region(
    region_polygon GEOGRAPHY
) RETURNS TABLE (
    language_name VARCHAR,
    talent_count BIGINT,
    avg_hourly_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.name as language_name,
        COUNT(*) as talent_count,
        AVG(vt.hourly_rate) as avg_hourly_rate
    FROM voice_talents vt
    JOIN languages l ON vt.language_id = l.id
    WHERE ST_Contains(region_polygon, vt.location)
    GROUP BY l.name
    ORDER BY talent_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for voice_talents
CREATE TRIGGER update_voice_talents_updated_at
    BEFORE UPDATE ON voice_talents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Insert initial data
INSERT INTO languages (name, code) VALUES
    ('English', 'en'),
    ('Spanish', 'es'),
    ('French', 'fr'),
    ('German', 'de'),
    ('Japanese', 'ja'),
    ('Mandarin', 'zh'),
    ('Russian', 'ru')
ON CONFLICT DO NOTHING;

INSERT INTO voice_categories (name, description) VALUES
    ('Commercial', 'Voice overs for commercials and advertisements'),
    ('Narration', 'Documentary and educational content narration'),
    ('Character', 'Character voices for animation and games'),
    ('Audiobook', 'Audiobook narration'),
    ('Corporate', 'Corporate training and presentations'),
    ('IVR', 'Interactive Voice Response systems')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON languages FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON voice_categories FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON voice_talents FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON reviews FOR SELECT USING (true);

-- Create policies for service role
CREATE POLICY "Enable all access for service role" ON languages USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON voice_categories USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON voice_talents USING (auth.role() = 'service_role');
CREATE POLICY "Enable all access for service role" ON reviews USING (auth.role() = 'service_role');
