import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Complete list of all 195 UN-recognized countries
const COUNTRIES = [
  { id: 1, name: 'Afghanistan' },
  { id: 2, name: 'Albania' },
  { id: 3, name: 'Algeria' },
  { id: 4, name: 'Andorra' },
  { id: 5, name: 'Angola' },
  { id: 6, name: 'Antigua and Barbuda' },
  { id: 7, name: 'Argentina' },
  { id: 8, name: 'Armenia' },
  { id: 9, name: 'Australia' },
  { id: 10, name: 'Austria' },
  { id: 11, name: 'Azerbaijan' },
  { id: 12, name: 'Bahamas' },
  { id: 13, name: 'Bahrain' },
  { id: 14, name: 'Bangladesh' },
  { id: 15, name: 'Barbados' },
  { id: 16, name: 'Belarus' },
  { id: 17, name: 'Belgium' },
  { id: 18, name: 'Belize' },
  { id: 19, name: 'Benin' },
  { id: 20, name: 'Bhutan' },
  { id: 21, name: 'Bolivia' },
  { id: 22, name: 'Bosnia and Herzegovina' },
  { id: 23, name: 'Botswana' },
  { id: 24, name: 'Brazil' },
  { id: 25, name: 'Brunei' },
  { id: 26, name: 'Bulgaria' },
  { id: 27, name: 'Burkina Faso' },
  { id: 28, name: 'Burundi' },
  { id: 29, name: 'Cabo Verde' },
  { id: 30, name: 'Cambodia' },
  { id: 31, name: 'Cameroon' },
  { id: 32, name: 'Canada' },
  { id: 33, name: 'Central African Republic' },
  { id: 34, name: 'Chad' },
  { id: 35, name: 'Chile' },
  { id: 36, name: 'China' },
  { id: 37, name: 'Colombia' },
  { id: 38, name: 'Comoros' },
  { id: 39, name: 'Congo' },
  { id: 40, name: 'Congo (Democratic Republic)' },
  { id: 41, name: 'Costa Rica' },
  { id: 42, name: 'Croatia' },
  { id: 43, name: 'Cuba' },
  { id: 44, name: 'Cyprus' },
  { id: 45, name: 'Czech Republic' },
  { id: 46, name: 'Côte d\'Ivoire' },
  { id: 47, name: 'Denmark' },
  { id: 48, name: 'Djibouti' },
  { id: 49, name: 'Dominica' },
  { id: 50, name: 'Dominican Republic' },
  { id: 51, name: 'Ecuador' },
  { id: 52, name: 'Egypt' },
  { id: 53, name: 'El Salvador' },
  { id: 54, name: 'Equatorial Guinea' },
  { id: 55, name: 'Eritrea' },
  { id: 56, name: 'Estonia' },
  { id: 57, name: 'Eswatini' },
  { id: 58, name: 'Ethiopia' },
  { id: 59, name: 'Fiji' },
  { id: 60, name: 'Finland' },
  { id: 61, name: 'France' },
  { id: 62, name: 'Gabon' },
  { id: 63, name: 'Gambia' },
  { id: 64, name: 'Georgia' },
  { id: 65, name: 'Germany' },
  { id: 66, name: 'Ghana' },
  { id: 67, name: 'Greece' },
  { id: 68, name: 'Grenada' },
  { id: 69, name: 'Guatemala' },
  { id: 70, name: 'Guinea' },
  { id: 71, name: 'Guinea-Bissau' },
  { id: 72, name: 'Guyana' },
  { id: 73, name: 'Haiti' },
  { id: 74, name: 'Honduras' },
  { id: 75, name: 'Hungary' },
  { id: 76, name: 'Iceland' },
  { id: 77, name: 'India' },
  { id: 78, name: 'Indonesia' },
  { id: 79, name: 'Iran' },
  { id: 80, name: 'Iraq' },
  { id: 81, name: 'Ireland' },
  { id: 82, name: 'Israel' },
  { id: 83, name: 'Italy' },
  { id: 84, name: 'Jamaica' },
  { id: 85, name: 'Japan' },
  { id: 86, name: 'Jordan' },
  { id: 87, name: 'Kazakhstan' },
  { id: 88, name: 'Kenya' },
  { id: 89, name: 'Kiribati' },
  { id: 90, name: 'Kuwait' },
  { id: 91, name: 'Kyrgyzstan' },
  { id: 92, name: 'Laos' },
  { id: 93, name: 'Latvia' },
  { id: 94, name: 'Lebanon' },
  { id: 95, name: 'Lesotho' },
  { id: 96, name: 'Liberia' },
  { id: 97, name: 'Libya' },
  { id: 98, name: 'Liechtenstein' },
  { id: 99, name: 'Lithuania' },
  { id: 100, name: 'Luxembourg' },
  { id: 101, name: 'Madagascar' },
  { id: 102, name: 'Malawi' },
  { id: 103, name: 'Malaysia' },
  { id: 104, name: 'Maldives' },
  { id: 105, name: 'Mali' },
  { id: 106, name: 'Malta' },
  { id: 107, name: 'Marshall Islands' },
  { id: 108, name: 'Mauritania' },
  { id: 109, name: 'Mauritius' },
  { id: 110, name: 'Mexico' },
  { id: 111, name: 'Micronesia' },
  { id: 112, name: 'Moldova' },
  { id: 113, name: 'Monaco' },
  { id: 114, name: 'Mongolia' },
  { id: 115, name: 'Montenegro' },
  { id: 116, name: 'Morocco' },
  { id: 117, name: 'Mozambique' },
  { id: 118, name: 'Myanmar' },
  { id: 119, name: 'Namibia' },
  { id: 120, name: 'Nauru' },
  { id: 121, name: 'Nepal' },
  { id: 122, name: 'Netherlands' },
  { id: 123, name: 'New Zealand' },
  { id: 124, name: 'Nicaragua' },
  { id: 125, name: 'Niger' },
  { id: 126, name: 'Nigeria' },
  { id: 127, name: 'North Korea' },
  { id: 128, name: 'North Macedonia' },
  { id: 129, name: 'Norway' },
  { id: 130, name: 'Oman' },
  { id: 131, name: 'Pakistan' },
  { id: 132, name: 'Palau' },
  { id: 133, name: 'Palestine' },
  { id: 134, name: 'Panama' },
  { id: 135, name: 'Papua New Guinea' },
  { id: 136, name: 'Paraguay' },
  { id: 137, name: 'Peru' },
  { id: 138, name: 'Philippines' },
  { id: 139, name: 'Poland' },
  { id: 140, name: 'Portugal' },
  { id: 141, name: 'Qatar' },
  { id: 142, name: 'Romania' },
  { id: 143, name: 'Russia' },
  { id: 144, name: 'Rwanda' },
  { id: 145, name: 'Saint Kitts and Nevis' },
  { id: 146, name: 'Saint Lucia' },
  { id: 147, name: 'Saint Vincent and the Grenadines' },
  { id: 148, name: 'Samoa' },
  { id: 149, name: 'San Marino' },
  { id: 150, name: 'Sao Tome and Principe' },
  { id: 151, name: 'Saudi Arabia' },
  { id: 152, name: 'Senegal' },
  { id: 153, name: 'Serbia' },
  { id: 154, name: 'Seychelles' },
  { id: 155, name: 'Sierra Leone' },
  { id: 156, name: 'Singapore' },
  { id: 157, name: 'Slovakia' },
  { id: 158, name: 'Slovenia' },
  { id: 159, name: 'Solomon Islands' },
  { id: 160, name: 'Somalia' },
  { id: 161, name: 'South Africa' },
  { id: 162, name: 'South Korea' },
  { id: 163, name: 'South Sudan' },
  { id: 164, name: 'Spain' },
  { id: 165, name: 'Sri Lanka' },
  { id: 166, name: 'Sudan' },
  { id: 167, name: 'Suriname' },
  { id: 168, name: 'Sweden' },
  { id: 169, name: 'Switzerland' },
  { id: 170, name: 'Syria' },
  { id: 171, name: 'Tajikistan' },
  { id: 172, name: 'Tanzania' },
  { id: 173, name: 'Thailand' },
  { id: 174, name: 'Timor-Leste' },
  { id: 175, name: 'Togo' },
  { id: 176, name: 'Tonga' },
  { id: 177, name: 'Trinidad and Tobago' },
  { id: 178, name: 'Tunisia' },
  { id: 179, name: 'Turkey' },
  { id: 180, name: 'Turkmenistan' },
  { id: 181, name: 'Tuvalu' },
  { id: 182, name: 'Uganda' },
  { id: 183, name: 'Ukraine' },
  { id: 184, name: 'United Arab Emirates' },
  { id: 185, name: 'United Kingdom' },
  { id: 186, name: 'United States' },
  { id: 187, name: 'Uruguay' },
  { id: 188, name: 'Uzbekistan' },
  { id: 189, name: 'Vanuatu' },
  { id: 190, name: 'Vatican City' },
  { id: 191, name: 'Venezuela' },
  { id: 192, name: 'Vietnam' },
  { id: 193, name: 'Yemen' },
  { id: 194, name: 'Zambia' },
  { id: 195, name: 'Zimbabwe' }
].sort((a, b) => a.name.localeCompare(b.name));

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
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Filter countries based on search term
  const filteredCountries = searchTerm.trim()
    ? COUNTRIES.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : COUNTRIES;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev < filteredCountries.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : filteredCountries.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredCountries[focusedIndex]) {
          handleSelect(filteredCountries[focusedIndex].name);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSelect = (countryName: string) => {
    onValueChange(countryName);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn(
          "block truncate",
          !value && "text-muted-foreground"
        )}>
          {value || placeholder}
        </span>
        <div className="flex items-center space-x-2">
          {value && (
            <button
              type="button"
              onClick={clearSelection}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown className={cn(
            "h-4 w-4 shrink-0 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="relative p-2 border-b border-border">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setFocusedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search countries..."
              className="h-9 w-full pl-8 pr-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Country List */}
          <div className="max-h-64 overflow-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No countries found for "{searchTerm}"
              </div>
            ) : (
              filteredCountries.map((country, index) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleSelect(country.name)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    index === focusedIndex && "bg-accent text-accent-foreground",
                    value === country.name && "bg-primary/10 text-primary font-medium"
                  )}
                >
                  {country.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}