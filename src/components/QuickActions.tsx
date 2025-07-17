import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';
interface QuickAction {
  label: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  primary: boolean;
  action: () => void;
}
export function QuickActions() {
  const navigate = useNavigate();
  const actions: QuickAction[] = [{
    label: 'Add Employee',
    description: 'Onboard new team member',
    icon: Plus,
    primary: true,
    action: () => navigate('/dashboard/add-employee')
  }, {
    label: 'Review Leaves',
    description: 'Approve pending requests',
    icon: CheckCircle,
    primary: false,
    action: () => navigate('/dashboard/leaves')
  }];
  return <Card className="shadow-sm">
      <CardHeader className="pb-6 p-6">
        <CardTitle className="text-base font-semibold text-foreground">
          Quick Actions
        </CardTitle>
        
      </CardHeader>
      <CardContent className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 p-6 pt-0">
        {actions.map((action, index) => <Button key={index} variant="outline" className="h-auto p-5 justify-start group hover:shadow-md transition-all flex-col items-start text-left min-h-28 hover:bg-muted" onClick={action.action}>
            <div className="flex items-center gap-3 w-full">
              <div className="p-2.5 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
                <action.icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-3">
              <div className="font-medium text-sm">{action.label}</div>
              <div className="text-xs opacity-80 mt-1">{action.description}</div>
            </div>
          </Button>)}
      </CardContent>
    </Card>;
}