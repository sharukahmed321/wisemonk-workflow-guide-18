
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PreboardingFlow } from '@/components/PreboardingFlow';

export default function StandalonePreboardingPage() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  // UUID validation regex
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Debug logging
  console.log('🔍 StandalonePreboarding - Received employeeId:', employeeId);
  console.log('🔍 StandalonePreboarding - Is valid UUID:', employeeId ? isValidUUID(employeeId) : false);

  if (!employeeId || employeeId === ':employeeId' || !isValidUUID(employeeId)) {
    const errorReason = !employeeId 
      ? 'No employee ID provided' 
      : employeeId === ':employeeId' 
      ? 'Invalid URL format - using route parameter instead of actual UUID'
      : 'Invalid employee ID format';

    console.error('❌ StandalonePreboarding - Invalid employeeId:', { employeeId, errorReason });

    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-foreground mb-4">Invalid Employee ID</h1>
          <p className="text-muted-foreground mb-2">{errorReason}</p>
          <p className="text-sm text-muted-foreground mb-4">
            Please ensure you're using a valid employee UUID in the URL format: 
            <code className="bg-muted px-2 py-1 rounded text-xs">/preboarding/[valid-uuid]</code>
          </p>
          <Button onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  // Get employee name from mock user data or invitation
  const mockUser = JSON.parse(localStorage.getItem('mock_user') || '{}');
  const employeeName = mockUser.firstName && mockUser.lastName 
    ? `${mockUser.firstName} ${mockUser.lastName}` 
    : 'New Employee';

  const handleComplete = () => {
    // Show completion message instead of redirecting to dashboard
    navigate('/preboarding-complete');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Standalone Header */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Employee Preboarding</h1>
              <p className="text-muted-foreground">Complete your onboarding process</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Home
            </Button>
          </div>
        </div>
      </div>

      {/* Preboarding Content */}
      <div className="p-6">
        <PreboardingFlow
          employeeId={employeeId}
          employeeName={employeeName}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
