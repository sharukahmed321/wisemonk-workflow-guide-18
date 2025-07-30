import React, { useState } from 'react';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCountrySearch } from '@/hooks/useCountrySearch';

interface CountrySelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function CountrySelect({ 
  value, 
  onValueChange, 
  placeholder = "Select country", 
  disabled,
  className 
}: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { countries, loading, error } = useCountrySearch(searchTerm);

  // Add defensive check to ensure countries is always an array
  const safeCountries = Array.isArray(countries) ? countries : [];
  
  // Add debugging
  console.log("CountrySelect render - countries:", countries, "safeCountries:", safeCountries, "loading:", loading);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between h-11", className)}
        >
          {value || placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        {/* Only render Command when countries array is properly initialized */}
        {safeCountries ? (
          <Command>
            <CommandInput 
              placeholder="Search countries..." 
              className="h-9"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}
            {error && (
              <div className="p-4 text-sm text-destructive">
                {error}
              </div>
            )}
            {!loading && !error && safeCountries.length === 0 && (
              <CommandEmpty>No country found.</CommandEmpty>
            )}
            {!loading && !error && safeCountries.length > 0 && (
              <CommandGroup className="max-h-64 overflow-auto">
                {safeCountries.map((country) => (
                  <CommandItem
                    key={country.id}
                    value={country.name}
                    onSelect={(currentValue) => {
                      // Prevent event bubbling that might trigger form submission
                      const selectedCountry = safeCountries.find(c => c.name.toLowerCase() === currentValue.toLowerCase());
                      if (selectedCountry) {
                        onValueChange(selectedCountry.name);
                        setOpen(false);
                        setSearchTerm('');
                      }
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === country.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {country.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </Command>
        ) : (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}