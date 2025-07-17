import React, { useState, useMemo } from 'react';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Employee, EmployeeStatus, Department, EmploymentType } from '@/types/employee';
import { mockEmployees } from '@/data/employees';
import { EmployeeTable } from '@/components/EmployeeTable';
import { EmployeeCard } from '@/components/EmployeeCard';
import { EmployeeFilters } from '@/components/EmployeeFilters';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';

export default function People() {
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<EmployeeStatus | 'All'>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | 'All'>('All');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<EmploymentType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const filteredEmployees = useMemo(() => {
    let filtered = mockEmployees;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(employee =>
        `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== 'All') {
      filtered = filtered.filter(employee => employee.status === selectedStatus);
    }

    // Filter by department
    if (selectedDepartment !== 'All') {
      filtered = filtered.filter(employee => employee.department === selectedDepartment);
    }

    // Filter by employment type
    if (selectedEmploymentType !== 'All') {
      filtered = filtered.filter(employee => employee.employmentType === selectedEmploymentType);
    }

    return filtered;
  }, [searchQuery, selectedStatus, selectedDepartment, selectedEmploymentType]);

  const statusCounts = useMemo(() => {
    return {
      Active: mockEmployees.filter(emp => emp.status === 'Active').length,
      Onboarding: mockEmployees.filter(emp => emp.status === 'Onboarding').length,
      Exit: mockEmployees.filter(emp => emp.status === 'Exit').length,
    };
  }, []);

  const handleAddEmployee = () => {
    navigate('/dashboard/people/add');
  };

  return (
    <div className="w-full p-6 md:p-8">
      <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">People</h1>
          <p className="text-muted-foreground mt-0.5">
            Manage your team members and their information
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Toggle
              pressed={viewMode === 'grid'}
              onPressedChange={() => setViewMode('grid')}
              size="sm"
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={viewMode === 'table'}
              onPressedChange={() => setViewMode('table')}
              size="sm"
              aria-label="Table view"
            >
              <List className="h-4 w-4" />
            </Toggle>
          </div>
          
          <Button onClick={handleAddEmployee} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters */}
      <EmployeeFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={setSelectedDepartment}
        selectedEmploymentType={selectedEmploymentType}
        onEmploymentTypeChange={setSelectedEmploymentType}
        statusCounts={statusCounts}
        totalCount={mockEmployees.length}
      />

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredEmployees.length === mockEmployees.length
          ? `Showing all ${filteredEmployees.length} employees`
          : `Showing ${filteredEmployees.length} of ${mockEmployees.length} employees`
        }
      </div>

      {/* Employee Grid/Table */}
      {filteredEmployees.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEmployees.map((employee) => (
              <EmployeeCard key={employee.id} employee={employee} />
            ))}
          </div>
        ) : (
          <div className="hidden sm:block">
            <EmployeeTable employees={filteredEmployees} />
          </div>
        )
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="max-w-sm mx-auto">
            <div className="h-20 w-20 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {searchQuery || selectedStatus !== 'All' || selectedDepartment !== 'All' || selectedEmploymentType !== 'All'
                ? 'No employees found'
                : 'No employees yet'
              }
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedStatus !== 'All' || selectedDepartment !== 'All' || selectedEmploymentType !== 'All'
                ? 'Try adjusting your filters or search terms.'
                : 'Get started by adding your first team member.'
              }
            </p>
            {(!searchQuery && selectedStatus === 'All' && selectedDepartment === 'All' && selectedEmploymentType === 'All') && (
              <Button onClick={handleAddEmployee} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Employee
              </Button>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}