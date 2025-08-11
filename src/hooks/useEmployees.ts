import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee, EmployeeStatus } from '@/types/employee';

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, fetch from employees table
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('*');

      if (employeesError) {
        console.error('Error fetching employees:', employeesError);
        setError(employeesError.message);
        return;
      }

      // Then, fetch invited employees from profiles table (pre-registered)
     /* const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_pre_registered', true)
        .is('user_id', null);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError(profilesError.message);
        return;
      }*/

      // Combine and transform data
      const combinedEmployees: Employee[] = [
        // Map employees table data
        ...(employeesData || []).map(emp => ({
          id: emp.id,
          employeeId: emp.employee_id,
          firstName: emp.first_name,
          lastName: emp.last_name,
          email: emp.email,
          phone: emp.phone || '',
          jobTitle: emp.job_title,
          department: emp.department as any,
          employmentType: emp.employment_type as any,
          salary: emp.salary || 0,
          startDate: emp.start_date,
          status: emp.status as EmployeeStatus,
          avatar: emp.avatar_url,
          birthday: emp.birthday ? new Date(emp.birthday).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : undefined,
        }))
        // Map invited employees from profiles
       /* ...(profilesData || []).map(profile => ({
          id: profile.id,
          employeeId: `INV-${profile.id.slice(0, 8).toUpperCase()}`,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          email: profile.email,
          phone: profile.phone || '',
          jobTitle: profile.job_title || 'Pending',
          department: (profile.department || 'TBD') as any,
          employmentType: 'Full-time' as any,
          salary: 0,
          startDate: profile.invited_at || profile.created_at,
          status: 'Invited' as EmployeeStatus,
          joiningDate: profile.invited_at,
          preboardingStatus: 'Invitation Sent' as any,
        }))*/
      ];

      setEmployees(combinedEmployees);
    } catch (err) {
      console.error('Unexpected error fetching employees:', err);
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCounts = () => {
    return {
      Active: employees.filter(emp => emp.status === 'Active').length,
      Onboarding: employees.filter(emp => emp.status === 'Onboarding').length,
      Preboarding: employees.filter(emp => emp.status === 'Preboarding').length,
      Invited: employees.filter(emp => emp.status === 'Invited').length,
    };
  };

  return {
    employees,
    loading,
    error,
    refetch: fetchEmployees,
    statusCounts: getStatusCounts(),
  };
}