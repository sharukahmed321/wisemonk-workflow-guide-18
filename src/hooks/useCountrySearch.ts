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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchCountries = async () => {
      if (searchTerm.length === 0) {
        // Load all countries initially
        setLoading(true);
        setError(null);
        try {
          const { data, error } = await supabase.rpc('search_countries', {
            search_term: ''
          });
          
          if (error) throw error;
          setCountries(Array.isArray(data) ? data : []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load countries');
          setCountries([]); // Ensure we always have an array
        } finally {
          setLoading(false);
        }
        return;
      }

      // Only search if we have at least 1 character
      if (searchTerm.length >= 1) {
        setLoading(true);
        setError(null);
        try {
          const { data, error } = await supabase.rpc('search_countries', {
            search_term: searchTerm
          });
          
          if (error) throw error;
          setCountries(Array.isArray(data) ? data : []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to search countries');
          setCountries([]); // Ensure we always have an array
        } finally {
          setLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(searchCountries, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return { countries, loading, error };
}