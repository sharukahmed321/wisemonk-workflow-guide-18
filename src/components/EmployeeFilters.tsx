
import { Search, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EmployeeFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  progressFilter: string;
  onProgressFilterChange: (filter: string) => void;
  stats: {
    total: number;
    documentsNeeded: number;
    bgvPending: number;
    readyToActivate: number;
  };
}

export function EmployeeFilters({
  searchQuery,
  onSearchChange,
  progressFilter,
  onProgressFilterChange,
  stats
}: EmployeeFiltersProps) {
  const progressFilters = [
    { value: 'All', label: 'All', count: stats.total },
    { value: 'documents-needed', label: 'Documents Needed', count: stats.documentsNeeded },
    { value: 'bgv-pending', label: 'BGV Pending', count: stats.bgvPending },
    { value: 'ready-to-activate', label: 'Ready to Activate', count: stats.readyToActivate }
  ];

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Progress Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {progressFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={progressFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onProgressFilterChange(filter.value)}
            className="gap-2"
          >
            {filter.label}
            <Badge variant="secondary" className="ml-1">
              {filter.count}
            </Badge>
          </Button>
        ))}
      </div>
    </div>
  );
}
