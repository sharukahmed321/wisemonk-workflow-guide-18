
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { EmployeeFilters } from '@/components/EmployeeFilters';
import { SimpleEmployeeTable } from '@/components/SimpleEmployeeTable';
import { PreboardingTable } from '@/components/PreboardingTable';
import { mockEmployees } from '@/data/employees';
import { mockPreboardingEmployees } from '@/data/employees';

export default function People() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [progressFilter, setProgressFilter] = useState('All');

  // Filter employees by status
  const activeEmployees = useMemo(() => 
    mockEmployees.filter(emp => emp.status === 'Active'), []);
  const onboardingEmployees = useMemo(() => 
    mockEmployees.filter(emp => emp.status === 'Onboarding'), []);
  const preboardingEmployees = useMemo(() => 
    mockPreboardingEmployees.filter(emp => emp.status === 'Preboarding'), []);

  // Filter preboarding employees based on search, status, and progress
  const filteredPreboardingEmployees = useMemo(() => {
    return preboardingEmployees.filter(employee => {
      const matchesSearch = searchQuery === '' || 
        employee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        employee.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProgress = progressFilter === 'All' || 
        (progressFilter === 'documents-needed' && (employee.preboarding?.overallProgress || 0) < 50) ||
        (progressFilter === 'bgv-pending' && employee.preboarding?.bgvStatus === 'pending') ||
        (progressFilter === 'ready-to-activate' && (employee.preboarding?.overallProgress || 0) >= 90);

      return matchesSearch && matchesProgress;
    });
  }, [preboardingEmployees, searchQuery, progressFilter]);

  // Calculate statistics
  const preboardingStats = useMemo(() => ({
    total: preboardingEmployees.length,
    documentsNeeded: preboardingEmployees.filter(emp => (emp.preboarding?.overallProgress || 0) < 50).length,
    bgvPending: preboardingEmployees.filter(emp => emp.preboarding?.bgvStatus === 'pending').length,
    readyToActivate: preboardingEmployees.filter(emp => (emp.preboarding?.overallProgress || 0) >= 90).length,
  }), [preboardingEmployees]);

  const handleAddEmployee = () => {
    navigate('/dashboard/people/add');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">People</h1>
          <p className="text-muted-foreground">Manage your team and employee information</p>
        </div>
        <Button onClick={handleAddEmployee}>
          <Plus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active ({activeEmployees.length})</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding ({onboardingEmployees.length})</TabsTrigger>
          <TabsTrigger value="preboarding">Preboarding ({preboardingEmployees.length})</TabsTrigger>
        </TabsList>

        {/* Active Employees Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeEmployees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No active employees found</p>
            </div>
          ) : (
            <SimpleEmployeeTable employees={activeEmployees} />
          )}
        </TabsContent>

        {/* Onboarding Employees Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          {onboardingEmployees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No onboarding employees found</p>
            </div>
          ) : (
            <SimpleEmployeeTable employees={onboardingEmployees} />
          )}
        </TabsContent>

        {/* Preboarding Employees Tab */}
        <TabsContent value="preboarding" className="space-y-4">
          <EmployeeFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            progressFilter={progressFilter}
            onProgressFilterChange={setProgressFilter}
            stats={preboardingStats}
          />
          {filteredPreboardingEmployees.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No preboarding employees found</p>
            </div>
          ) : (
            <PreboardingTable employees={filteredPreboardingEmployees} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
