import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Employee } from '@/types/employee';

export function useEmployee(employeeId: string | undefined) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId) {
      setEmployee(null);
      setLoading(false);
      return;
    }

    fetchEmployee();
  }, [employeeId]);

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      setError(null);

      // First, try to fetch from employees table by UUID (id)
      let { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', employeeId)
        .maybeSingle();

      // If not found by UUID, try by employee_id
      if (!employeeData && !employeeError) {
        const { data: employeeDataById, error: employeeErrorById } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', employeeId)
          .maybeSingle();
        
        employeeData = employeeDataById;
        employeeError = employeeErrorById;
      }

      if (employeeError) {
        console.error('Error fetching employee:', employeeError);
        setError(employeeError.message);
        return;
      }

      if (employeeData) {
        // Transform employee data to match the Employee interface
        const transformedEmployee: Employee = {
          id: employeeData.id,
          employeeId: employeeData.employee_id,
          firstName: employeeData.first_name,
          lastName: employeeData.last_name,
          email: employeeData.email,
          phone: employeeData.phone || '',
          jobTitle: employeeData.job_title,
          department: employeeData.department as any,
          employmentType: employeeData.employment_type as any,
          salary: employeeData.salary || 0,
          startDate: employeeData.start_date,
          status: employeeData.status as any,
          avatar: employeeData.avatar_url,
          birthday: employeeData.birthday ? new Date(employeeData.birthday).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }) : undefined,
        };

        setEmployee(transformedEmployee);
        return;
      }

      // If not found in employees table, check profiles table (for invited employees)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_pre_registered', true)
        .is('user_id', null)
        .ilike('email', `%${employeeId}%`); // Try to match by email pattern

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError(profileError.message);
        return;
      }

      // For invited employees, try to find by generated employee ID pattern
      const invitedProfile = profileData?.find(profile => 
        `INV-${profile.id.slice(0, 8).toUpperCase()}` === employeeId
      );

      if (invitedProfile) {
        const transformedEmployee: Employee = {
          id: invitedProfile.id,
          employeeId: `INV-${invitedProfile.id.slice(0, 8).toUpperCase()}`,
          firstName: invitedProfile.first_name || '',
          lastName: invitedProfile.last_name || '',
          email: invitedProfile.email,
          phone: invitedProfile.phone || '',
          jobTitle: invitedProfile.job_title || 'Pending',
          department: (invitedProfile.department || 'TBD') as any,
          employmentType: 'Full-time' as any,
          salary: 0,
          startDate: invitedProfile.invited_at || invitedProfile.created_at,
          status: 'Invited' as any,
          joiningDate: invitedProfile.invited_at,
          preboardingStatus: 'Invitation Sent' as any,
        };

        setEmployee(transformedEmployee);
        return;
      }

      // Employee not found
      setEmployee(null);
    } catch (err) {
      console.error('Unexpected error fetching employee:', err);
      setError('Failed to fetch employee');
    } finally {
      setLoading(false);
    }
  };

  return {
    employee,
    loading,
    error,
    refetch: fetchEmployee,
  };
}