
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle, TrendingUp, TrendingDown, Clock } from "lucide-react";

interface KPIData {
  title: string;
  value: string;
  change: string;
  changeValue: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ComponentType<{
    className?: string;
  }>;
  description?: string;
  link?: string;
}

const kpiData: KPIData[] = [{
  title: "Total Employees",
  value: "247",
  change: "+8 this month",
  changeValue: "+3.3%",
  trend: "up",
  icon: Users,
  description: "Active employees across all departments",
  link: "/dashboard/people"
}, {
  title: "New Hires",
  value: "12",
  change: "+3 this week",
  changeValue: "+25%",
  trend: "up",
  icon: Users,
  description: "Employees currently in onboarding",
  link: "/dashboard/people?filter=onboarding"
}, {
  title: "Attendance Rate",
  value: "94.2%",
  change: "+1.2% from last month",
  changeValue: "+1.2%",
  trend: "up",
  icon: CheckCircle,
  description: "Average attendance this month",
  link: "/dashboard/time"
}, {
  title: "Avg. working hours",
  value: "7.8h",
  change: "+0.3h from last month",
  changeValue: "+4%",
  trend: "up",
  icon: Clock,
  description: "Average daily working hours per employee",
  link: "/dashboard/time"
}];

export function KPICards() {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {kpiData.map((kpi, index) => <Card key={index} className="">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 p-5">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
            </div>
            <div className="p-1.5 rounded-lg bg-primary/10">
              <kpi.icon className="h-3.5 w-3.5 text-primary" />
            </div>
          </CardHeader>
          
          <CardContent className="p-5 pt-0">
            <div className="space-y-0.5">
              <div className="text-xl text-foreground">{kpi.value}</div>
              
            </div>
          </CardContent>
        </Card>)}
    </div>;
}
