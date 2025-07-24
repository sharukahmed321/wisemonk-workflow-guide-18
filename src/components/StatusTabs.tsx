
import React from 'react';
import { EmployeeStatus } from '@/types/employee';
import { cn } from '@/lib/utils';

interface StatusTabsProps {
  selectedStatus: EmployeeStatus;
  onStatusChange: (status: EmployeeStatus) => void;
  statusCounts: Record<EmployeeStatus, number>;
}

export function StatusTabs({
  selectedStatus,
  onStatusChange,
  statusCounts,
}: StatusTabsProps) {
  const tabs = [
    { value: 'Active', label: 'Active', count: statusCounts.Active },
    { value: 'Onboarding', label: 'Onboarding', count: statusCounts.Onboarding },
    { value: 'Preboarding', label: 'Preboarding', count: statusCounts.Preboarding },
  ] as const;

  return (
    <div className="border-b border-border">
      <div className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onStatusChange(tab.value as EmployeeStatus)}
            className={cn(
              "pb-4 px-1 text-sm font-medium border-b-2 transition-colors",
              selectedStatus === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
    </div>
  );
}
