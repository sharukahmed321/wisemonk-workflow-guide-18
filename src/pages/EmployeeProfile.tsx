
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmployeeProfileComponent from '@/components/EmployeeProfile';
import { useEmployees } from '@/hooks/useEmployees';

export default function EmployeeProfilePage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  
  return <EmployeeProfileComponent />;
}
