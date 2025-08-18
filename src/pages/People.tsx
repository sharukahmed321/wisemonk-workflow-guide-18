
import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmployeeStatus } from '@/types/employee';
import { EmployeeTable } from '@/components/EmployeeTable';
import { StatusTabs } from '@/components/StatusTabs';
import { Button } from '@/components/ui/button';
import { useEmployees } from '@/hooks/useEmployees';

export default function People() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus>('Active');
  const { employees, loading, error, statusCounts } = useEmployees();

  // Set initial tab based on URL parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['Active', 'Onboarding', 'Preboarding', 'Invited'].includes(tabParam)) {
      setSelectedStatus(tabParam as EmployeeStatus);
    }
  }, [searchParams]);

  const filteredEmployees = employees.filter(emp => emp.status === selectedStatus);

  const handleAddEmployee = () => {
    navigate('/dashboard/people/add');
  };

  if (loading) {
    return (
      <div className="w-full p-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Error loading employees: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6 md:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">People</h1>
            <p className="text-muted-foreground mt-0.5">
              Manage your team members and their information
            </p>
          </div>
          
          <Button onClick={handleAddEmployee} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>

        {/* Status Tabs */}
        <StatusTabs
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          statusCounts={statusCounts}
        />

        {/* Employee Table */}
        <EmployeeTable employees={filteredEmployees} selectedStatus={selectedStatus} />
      </div>
    </div>
  );
}
