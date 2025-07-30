-- Drop and recreate search_countries function to return JSON instead of table tuples
-- This resolves the "undefined is not iterable" error in the frontend

DROP FUNCTION IF EXISTS public.search_countries(text);

CREATE OR REPLACE FUNCTION public.search_countries(search_term text DEFAULT '')
RETURNS json
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
  FROM (
    SELECT c.id, c.name, c.iso_code_2, c.iso_code_3
    FROM public.countries c
    WHERE search_term = '' OR c.name ILIKE '%' || search_term || '%'
    ORDER BY c.name
    LIMIT 50
  ) t;
$$;