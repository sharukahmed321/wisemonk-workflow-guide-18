import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Dashboard } from './Dashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export function RoleBasedDashboard() {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Employee users only see preboarding interface
  if (userRole === 'employee') {
    return <EmployeeDashboard />;
  }

  // All other roles (client, manager, admin, etc.) see full dashboard
  return <Dashboard />;
}