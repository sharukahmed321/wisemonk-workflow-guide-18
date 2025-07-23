
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICards } from './KPICards';
import { Overview } from './Overview';
import { QuickActions } from './QuickActions';
import { Birthdays } from './Birthdays';
import { WorkAnniversaries } from './WorkAnniversaries';
import { PublicHolidays } from './PublicHolidays';

export function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your team today.
        </p>
      </div>

      <KPICards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Overview />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <QuickActions />
          <Birthdays />
          <WorkAnniversaries />
          <PublicHolidays />
        </div>
      </div>
    </div>
  );
}
