import React from 'react';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { EmployeeStatus, Department, EmploymentType } from '@/types/employee';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedStatus: EmployeeStatus | 'All';
  onStatusChange: (status: EmployeeStatus | 'All') => void;
  selectedDepartment: Department | 'All';
  onDepartmentChange: (department: Department | 'All') => void;
  selectedEmploymentType: EmploymentType | 'All';
  onEmploymentTypeChange: (type: EmploymentType | 'All') => void;
  statusCounts: Record<EmployeeStatus, number>;
  totalCount: number;
}

const statusFilters: Array<{ value: EmployeeStatus | 'All'; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'Active', label: 'Active' },
  { value: 'Onboarding', label: 'Onboarding' },
  { value: 'Exit', label: 'Exit' },
];

const departments: Array<{ value: Department | 'All'; label: string }> = [
  { value: 'All', label: 'All Departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'HR', label: 'HR' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Design', label: 'Design' },
];

const employmentTypes: Array<{ value: EmploymentType | 'All'; label: string }> = [
  { value: 'All', label: 'All Types' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
  { value: 'Intern', label: 'Intern' },
];

export function EmployeeFilters({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedDepartment,
  onDepartmentChange,
  selectedEmploymentType,
  onEmploymentTypeChange,
  statusCounts,
  totalCount,
}: EmployeeFiltersProps) {
  const getStatusCount = (status: EmployeeStatus | 'All') => {
    return status === 'All' ? totalCount : statusCounts[status as EmployeeStatus];
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, ID, title, or department..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Status Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedStatus === filter.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStatusChange(filter.value)}
              className="gap-2"
            >
              {filter.label}
              <Badge 
                variant="secondary" 
                className="ml-1 bg-background/50 text-foreground"
              >
                {getStatusCount(filter.value)}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Advanced Filters */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Department</label>
                <Select
                  value={selectedDepartment}
                  onValueChange={(value) => onDepartmentChange(value as Department | 'All')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Employment Type</label>
                <Select
                  value={selectedEmploymentType}
                  onValueChange={(value) => onEmploymentTypeChange(value as EmploymentType | 'All')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onDepartmentChange('All');
                  onEmploymentTypeChange('All');
                  onStatusChange('All');
                  onSearchChange('');
                }}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}