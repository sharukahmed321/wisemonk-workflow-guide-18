import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, Calendar } from 'lucide-react';

export function EmployeeStatusCards() {
  return (
    <div className="grid gap-4 md:gap-6">
      {/* Today's Status Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Today's Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-sm font-medium">Not clocked in</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Start your workday when ready
          </p>
        </CardContent>
      </Card>

      {/* Leave Balance Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Leave Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-sm font-medium">15 days remaining</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Annual leave balance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}