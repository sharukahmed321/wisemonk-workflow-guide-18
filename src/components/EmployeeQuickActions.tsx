import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Clock, Plus } from 'lucide-react';

export function EmployeeQuickActions() {
  const handleClockIn = () => {
    console.log('Clock in action');
    // TODO: Implement clock in functionality
  };

  const handleAddLeave = () => {
    console.log('Add leave request');
    // TODO: Implement leave request functionality
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Essential Actions</CardTitle>
        <CardDescription>Quick access to daily tasks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clock In Button */}
        <Button 
          onClick={handleClockIn}
          className="w-full justify-start h-auto p-4"
          size="lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-medium">Clock In</div>
              <div className="text-sm opacity-90">Start your workday</div>
            </div>
          </div>
        </Button>

        {/* Add Leave Button */}
        <Button 
          onClick={handleAddLeave}
          variant="outline"
          className="w-full justify-start h-auto p-4 hover:bg-muted"
          size="lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="font-medium">Add Leave</div>
              <div className="text-sm text-muted-foreground">Request time off</div>
            </div>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}