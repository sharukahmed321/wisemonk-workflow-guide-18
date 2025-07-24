
import React from 'react';
import { EmployeeStatus } from '@/types/employee';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface StatusTabsProps {
  selectedStatus: EmployeeStatus | 'All';
  onStatusChange: (status: EmployeeStatus | 'All') => void;
  statusCounts: Record<EmployeeStatus, number>;
  totalCount: number;
}

export function StatusTabs({
  selectedStatus,
  onStatusChange,
  statusCounts,
  totalCount,
}: StatusTabsProps) {
  const tabs = [
    { value: 'All', label: 'All', count: totalCount },
    { value: 'Active', label: 'Active', count: statusCounts.Active },
    { value: 'Onboarding', label: 'Onboarding', count: statusCounts.Onboarding },
    { value: 'Preboarding', label: 'Preboarding', count: statusCounts.Preboarding },
  ];

  return (
    <Tabs value={selectedStatus} onValueChange={(value) => onStatusChange(value as EmployeeStatus | 'All')}>
      <TabsList className="grid w-full grid-cols-4">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
            {tab.label}
            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs">
              {tab.count}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
