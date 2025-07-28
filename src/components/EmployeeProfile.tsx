
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Employee } from '@/types/employee';
import { cn } from '@/lib/utils';
import { EmployeeProfileHeader } from './EmployeeProfileHeader';
import { OverviewTab } from './OverviewTab';
import { DocumentsTab } from './DocumentsTab';

interface EmployeeProfileProps {
  employee: Employee;
}

type TabValue = 'overview' | 'documents' | 'leaves' | 'finance';

export function EmployeeProfile({ employee }: EmployeeProfileProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'documents', label: 'Documents' },
    { value: 'leaves', label: 'Leaves' },
    { value: 'finance', label: 'Finance' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* New Header Component */}
      <EmployeeProfileHeader employee={employee} />

      {/* Tabs Section */}
      <div className="w-full">
        {/* Tab Navigation */}
        <div className="border-b border-border mb-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "pb-4 px-1 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab employee={employee} />}
        
        {activeTab === 'documents' && <DocumentsTab />}

        {activeTab === 'leaves' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Leaves</h3>
              <p className="text-gray-600">Leave management functionality coming soon...</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'finance' && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Finance</h3>
              <p className="text-gray-600">Financial information functionality coming soon...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
