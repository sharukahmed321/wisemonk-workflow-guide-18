import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import { Dashboard } from './Dashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export function RoleBasedDashboard() {
  const { userRole, loading } = useAuth();
  const location = useLocation();

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
    // Check if employee is trying to access restricted routes
    const allowedEmployeeRoutes = [
      '/dashboard',
      '/dashboard/preboarding'
    ];
    
    const isAllowedRoute = allowedEmployeeRoutes.some(route => 
      location.pathname === route || location.pathname.startsWith(route + '/')
    );
    
    if (!isAllowedRoute) {
      // Redirect employees to their dashboard if accessing restricted routes
      return <Navigate to="/dashboard" replace />;
    }
    
    return <EmployeeDashboard />;
  }

  // All other roles (client, manager, admin, etc.) see full dashboard
  return <Dashboard />;
}