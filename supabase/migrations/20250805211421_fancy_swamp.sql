/*
  # Package Matching System

  1. New Tables
    - `service_package_filters` - Pre-computed filter combinations for fast matching
    - `package_recommendations` - Cached recommendations based on user preferences
    - `matching_criteria` - Standardized criteria for package matching

  2. Functions
    - `refresh_package_filters()` - Rebuilds the filter cache
    - `find_matching_packages()` - Fast package lookup function

  3. Security
    - Enable RLS on new tables
    - Add policies for public read access
*/

-- Create service_package_filters table for pre-computed combinations
CREATE TABLE IF NOT EXISTS service_package_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_package_id uuid NOT NULL REFERENCES service_packages(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  event_type text,
  hour_amount numeric,
  hour_range_min integer, -- For grouping (e.g., 3-5 hours = group 4)
  hour_range_max integer,
  price_cents integer NOT NULL,
  price_range text, -- 'under_1500', '1500_3000', '3000_5000', '5000_plus'
  coverage_events text[], -- Array of coverage events
  coverage_count integer DEFAULT 0,
  features_count integer DEFAULT 0,
  lookup_key text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_package_filters_service_type ON service_package_filters(service_type);
CREATE INDEX IF NOT EXISTS idx_package_filters_event_type ON service_package_filters(event_type);
CREATE INDEX IF NOT EXISTS idx_package_filters_hour_range ON service_package_filters(hour_range_min, hour_range_max);
CREATE INDEX IF NOT EXISTS idx_package_filters_price_range ON service_package_filters(price_range);
CREATE INDEX IF NOT EXISTS idx_package_filters_coverage ON service_package_filters USING gin(coverage_events);
CREATE INDEX IF NOT EXISTS idx_package_filters_lookup_key ON service_package_filters(lookup_key);

-- Create package_recommendations table for cached results
CREATE TABLE IF NOT EXISTS package_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL,
  event_type text,
  preference_type text, -- 'hours' or 'coverage'
  preference_value text, -- '4' for hours, 'Ceremony,Reception' for coverage
  budget_range text,
  recommended_package_id uuid REFERENCES service_packages(id),
  match_score integer DEFAULT 0, -- 0-100 score
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_lookup ON package_recommendations(service_type, event_type, preference_type, preference_value, budget_range);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON package_recommendations(match_score DESC);

-- Enable RLS
ALTER TABLE service_package_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to package filters"
  ON service_package_filters
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Allow public read access to recommendations"
  ON package_recommendations
  FOR SELECT
  TO public
  USING (true);

-- Function to refresh package filters
CREATE OR REPLACE FUNCTION refresh_package_filters()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clear existing filters
  DELETE FROM service_package_filters;
  
  -- Populate filters from service_packages
  INSERT INTO service_package_filters (
    service_package_id,
    service_type,
    event_type,
    hour_amount,
    hour_range_min,
    hour_range_max,
    price_cents,
    price_range,
    coverage_events,
    coverage_count,
    features_count,
    lookup_key
  )
  SELECT 
    sp.id,
    sp.service_type,
    sp.event_type,
    sp.hour_amount,
    -- Group hours into ranges (3-5 hours = group 4, etc.)
    CASE 
      WHEN sp.hour_amount <= 2 THEN 1
      WHEN sp.hour_amount <= 5 THEN FLOOR(sp.hour_amount)::integer
      WHEN sp.hour_amount <= 8 THEN 6
      WHEN sp.hour_amount <= 12 THEN 10
      ELSE 12
    END as hour_range_min,
    CASE 
      WHEN sp.hour_amount <= 2 THEN 3
      WHEN sp.hour_amount <= 5 THEN CEIL(sp.hour_amount)::integer + 1
      WHEN sp.hour_amount <= 8 THEN 9
      WHEN sp.hour_amount <= 12 THEN 12
      ELSE 24
    END as hour_range_max,
    sp.price,
    -- Categorize price ranges
    CASE 
      WHEN sp.price <= 150000 THEN 'under_1500'
      WHEN sp.price <= 300000 THEN '1500_3000'
      WHEN sp.price <= 500000 THEN '3000_5000'
      ELSE '5000_plus'
    END as price_range,
    -- Extract coverage events from JSONB
    CASE 
      WHEN sp.coverage->>'events' IS NOT NULL THEN 
        ARRAY(SELECT jsonb_array_elements_text(sp.coverage->'events'))
      ELSE ARRAY[]::text[]
    END as coverage_events,
    -- Count coverage events
    CASE 
      WHEN sp.coverage->>'events' IS NOT NULL THEN 
        jsonb_array_length(sp.coverage->'events')
      ELSE 0
    END as coverage_count,
    -- Count features
    COALESCE(array_length(sp.features, 1), 0) as features_count,
    sp.lookup_key
  FROM service_packages sp
  WHERE sp.status = 'approved';
  
  -- Update timestamps
  UPDATE service_package_filters SET updated_at = now();
END;
$$;

-- Function to find matching packages
CREATE OR REPLACE FUNCTION find_matching_packages(
  p_service_type text,
  p_event_type text DEFAULT NULL,
  p_preference_type text DEFAULT NULL,
  p_preference_value text DEFAULT NULL,
  p_budget_range text DEFAULT NULL
)
RETURNS TABLE (
  package_id uuid,
  package_name text,
  package_description text,
  package_price integer,
  package_features text[],
  package_coverage jsonb,
  package_hour_amount numeric,
  match_score integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id as package_id,
    sp.name as package_name,
    sp.description as package_description,
    sp.price as package_price,
    sp.features as package_features,
    sp.coverage as package_coverage,
    sp.hour_amount as package_hour_amount,
    -- Calculate match score
    (
      -- Base score for service type match
      CASE WHEN spf.service_type = p_service_type THEN 40 ELSE 0 END +
      -- Event type match
      CASE WHEN spf.event_type = p_event_type THEN 20 ELSE 0 END +
      -- Preference match
      CASE 
        WHEN p_preference_type = 'hours' AND p_preference_value IS NOT NULL THEN
          CASE 
            WHEN spf.hour_amount = p_preference_value::numeric THEN 30
            WHEN ABS(spf.hour_amount - p_preference_value::numeric) <= 1 THEN 20
            WHEN ABS(spf.hour_amount - p_preference_value::numeric) <= 2 THEN 10
            ELSE 0
          END
        WHEN p_preference_type = 'coverage' AND p_preference_value IS NOT NULL THEN
          -- Count matching coverage events
          (
            SELECT COUNT(*)::integer * 5
            FROM unnest(string_to_array(p_preference_value, ',')) AS requested_event
            WHERE requested_event = ANY(spf.coverage_events)
          )
        ELSE 0
      END +
      -- Budget match
      CASE 
        WHEN p_budget_range IS NOT NULL AND spf.price_range = p_budget_range THEN 10
        ELSE 0
      END
    )::integer as match_score
  FROM service_package_filters spf
  JOIN service_packages sp ON sp.id = spf.service_package_id
  WHERE 
    spf.is_active = true
    AND (p_service_type IS NULL OR spf.service_type = p_service_type OR spf.lookup_key = lower(p_service_type))
    AND (p_event_type IS NULL OR spf.event_type = p_event_type)
    AND (p_budget_range IS NULL OR spf.price_range = p_budget_range)
    AND (
      p_preference_type IS NULL 
      OR p_preference_value IS NULL
      OR (
        p_preference_type = 'hours' 
        AND p_preference_value IS NOT NULL 
        AND ABS(spf.hour_amount - p_preference_value::numeric) <= 2
      )
      OR (
        p_preference_type = 'coverage' 
        AND p_preference_value IS NOT NULL
        AND spf.coverage_events && string_to_array(p_preference_value, ',')
      )
    )
  ORDER BY match_score DESC, sp.price ASC
  LIMIT 10;
END;
$$;

-- Populate the filters table
SELECT refresh_package_filters();