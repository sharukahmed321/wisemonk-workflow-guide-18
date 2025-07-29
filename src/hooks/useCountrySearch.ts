import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Country {
  id: number;
  name: string;
  iso_code_2: string | null;
  iso_code_3: string | null;
}

export function useCountrySearch(searchTerm: string = '') {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchCountries = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase.rpc('search_countries', {
          search_term: searchTerm
        });
        
        if (error) throw error;
        setCountries(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load countries');
        setCountries([]); // Ensure we always have an array
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchCountries, searchTerm ? 300 : 0); // No debounce for initial load
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return { countries, loading, error };
}