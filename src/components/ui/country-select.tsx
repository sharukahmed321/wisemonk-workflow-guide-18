import React, { useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { COUNTRIES } from '@/lib/validationUtils';

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
        <Command>
          <CommandInput 
            placeholder="Search countries..." 
            className="h-9"
          />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {COUNTRIES.map((country) => (
              <CommandItem
                key={country}
                value={country}
                onSelect={() => {
                  onValueChange(country);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === country ? "opacity-100" : "opacity-0"
                  )}
                />
                {country}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}