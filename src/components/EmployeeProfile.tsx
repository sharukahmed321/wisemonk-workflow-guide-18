
import React, { useState } from 'react';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Component */}
      <EmployeeProfileHeader employee={employee} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "pb-4 px-1 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.value
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="pb-8">
          {activeTab === 'overview' && <OverviewTab employee={employee} />}
          
          {activeTab === 'documents' && <DocumentsTab />}

          {activeTab === 'leaves' && (
            <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Leaves</h3>
              <p className="text-gray-600">Leave management functionality coming soon...</p>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="bg-white rounded-lg border border-gray-100 p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Finance</h3>
              <p className="text-gray-600">Financial information functionality coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
