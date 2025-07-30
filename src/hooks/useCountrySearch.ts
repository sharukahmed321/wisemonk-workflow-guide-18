import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Country {
  id: number;
  name: string;
  iso_code_2: string | null;
  iso_code_3: string | null;
}

export function useCountrySearch(searchTerm: string = '') {
  const [countries, setCountries] = useState<Country[]>([]); // Always initialize as empty array
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchCountries = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: supabaseError } = await supabase.rpc('search_countries', {
          search_term: searchTerm
        });
        
        if (supabaseError) throw supabaseError;
        
        // Handle the RPC response - it returns data directly as an array
        const countryArray = Array.isArray(data) 
          ? data.map((item: any) => ({
              id: item.id,
              name: item.name,
              iso_code_2: item.iso_code_2,
              iso_code_3: item.iso_code_3
            }))
          : [];
        
        setCountries(countryArray);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load countries');
        setCountries([]); // Ensure we always have an array
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchCountries, searchTerm ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return { 
    countries, 
    isLoading, 
    error 
  };
}