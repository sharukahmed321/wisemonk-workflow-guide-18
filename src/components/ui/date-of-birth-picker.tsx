import React, { useState, useRef, useEffect } from 'react';
import { format, parse, isValid, isAfter, isBefore } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface DateOfBirthPickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  minYear?: number;
  maxYear?: number;
}

const MONTHS = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];

export function DateOfBirthPicker({
  value,
  onChange,
  placeholder = "Select date of birth",
  disabled = false,
  error,
  className,
  dateFormat = 'DD/MM/YYYY',
  minYear = 1950,
  maxYear = new Date().getFullYear(),
}: DateOfBirthPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
  if (value && isValid(value)) {
    return new Date(value.getFullYear(), value.getMonth(), 1);
  }
  // Default to around 30 years ago for better UX
  const defaultYear = new Date().getFullYear() - 30;
  return new Date(defaultYear, 0, 1);
});
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate years array
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  // Update input when value changes
  useEffect(() => {
    if (value && isValid(value)) {
      const formatString = dateFormat === 'DD/MM/YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
      setInputValue(format(value, formatString));
    } else {
      setInputValue('');
    }
  }, [value, dateFormat]);

  // Update calendar month when value changes
  useEffect(() => {
    if (value && isValid(value)) {
      setCalendarMonth(new Date(value.getFullYear(), value.getMonth(), 1));
    }
  }, [value]);

  const handleInputChange = (inputValue: string) => {
    setInputValue(inputValue);

    // Try to parse the input
    const formatString = dateFormat === 'DD/MM/YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
    
    // Allow partial input
    if (inputValue.length === 10) {
      try {
        const parsedDate = parse(inputValue, formatString, new Date());
        
        if (isValid(parsedDate) && isValidDateOfBirth(parsedDate)) {
          onChange?.(parsedDate);
          setCalendarMonth(new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1));
        }
      } catch (error) {
        // Invalid date format, don't update
      }
    }
  };

  const handleInputBlur = () => {
    // Validate and format the input on blur
    if (inputValue) {
      const formatString = dateFormat === 'DD/MM/YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
      
      try {
        const parsedDate = parse(inputValue, formatString, new Date());
        
        if (isValid(parsedDate) && isValidDateOfBirth(parsedDate)) {
          onChange?.(parsedDate);
          setInputValue(format(parsedDate, formatString));
        } else {
          // Reset to current value or empty
          if (value && isValid(value)) {
            setInputValue(format(value, formatString));
          } else {
            setInputValue('');
            onChange?.(undefined);
          }
        }
      } catch (error) {
        // Reset on invalid format
        if (value && isValid(value)) {
          const formatString = dateFormat === 'DD/MM/YYYY' ? 'dd/MM/yyyy' : 'MM/dd/yyyy';
          setInputValue(format(value, formatString));
        } else {
          setInputValue('');
          onChange?.(undefined);
        }
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date && isValidDateOfBirth(date)) {
      onChange?.(date);
      setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
      setIsOpen(false);
    }
  };

  const handleYearChange = (year: string) => {
    if (calendarMonth instanceof Date && isValid(calendarMonth)) {
      const newDate = new Date(parseInt(year), calendarMonth.getMonth(), 1);
      setCalendarMonth(newDate);
    } else {
      const newDate = new Date(parseInt(year), 0, 1);
      setCalendarMonth(newDate);
    }
    
    // Update the selected date if there is one
    if (value) {
      const updatedDate = new Date(parseInt(year), value.getMonth(), value.getDate());
      if (isValidDateOfBirth(updatedDate)) {
        onChange?.(updatedDate);
      }
    }
  };

  const handleMonthChange = (month: string) => {
    if (calendarMonth instanceof Date && isValid(calendarMonth)) {
      const newDate = new Date(calendarMonth.getFullYear(), parseInt(month), 1);
      setCalendarMonth(newDate);
    } else {
      const newDate = new Date(new Date().getFullYear(), parseInt(month), 1);
      setCalendarMonth(newDate);
    }
    
    // Update the selected date if there is one
    if (value) {
      const updatedDate = new Date(value.getFullYear(), parseInt(month), value.getDate());
      if (isValidDateOfBirth(updatedDate)) {
        onChange?.(updatedDate);
      }
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (calendarMonth instanceof Date && isValid(calendarMonth)) {
      const newMonth = direction === 'prev' 
        ? new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
        : new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
      
      setCalendarMonth(newMonth);
    }
  };

  const isValidDateOfBirth = (date: Date): boolean => {
    const today = new Date();
    const minDate = new Date(minYear, 0, 1);
    
    return isValid(date) && 
           !isAfter(date, today) && 
           !isBefore(date, minDate);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsOpen(true);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "pr-10 cursor-pointer",
                error && "border-destructive focus-visible:ring-destructive"
              )}
              autoComplete="bday"
            />
            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </PopoverTrigger>
        
        <PopoverContent 
          className="w-auto p-0 bg-popover border shadow-md z-50" 
          align="start"
          side="bottom"
        >
          <div className="p-4 space-y-4">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2">
                <Select
                  value={(calendarMonth instanceof Date && isValid(calendarMonth)) ? calendarMonth.getMonth().toString() : "0"}
                  onValueChange={handleMonthChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select
                  value={(calendarMonth instanceof Date && isValid(calendarMonth)) ? calendarMonth.getFullYear().toString() : new Date().getFullYear().toString()}
                  onValueChange={handleYearChange}
                  disabled={disabled}
                >
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="h-48">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar */}
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleCalendarSelect}
              month={calendarMonth}
              onMonthChange={(month) => {
                // Ensure month is always a Date object
                if (month instanceof Date && isValid(month)) {
                  setCalendarMonth(month);
                }
              }}
              disabled={(date) => !isValidDateOfBirth(date) || disabled}
              initialFocus
              className="p-0 pointer-events-auto"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: cn(
                  "h-8 w-8 text-center text-sm p-0 relative",
                  "focus-within:relative focus-within:z-20"
                ),
                day: cn(
                  "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground"
                ),
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_hidden: "invisible",
              }}
            />
            
            {/* Quick Actions */}
            <div className="flex justify-between pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange?.(undefined);
                  setInputValue('');
                  setIsOpen(false);
                }}
                disabled={!value}
                className="text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}