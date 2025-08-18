import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Users } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  primary: boolean;
  action: () => void;
  tooltip: string;
  gradient?: string;
  permission?: (permissions: any) => boolean;
}
export function QuickActions() {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const actions: QuickAction[] = [{
    id: 'add-employee',
    label: 'Add Employee',
    description: 'Onboard new team member',
    tooltip: 'Add a new employee to your organization',
    icon: Plus,
    primary: true,
    gradient: 'from-primary/20 to-primary/5',
    action: () => navigate('/dashboard/add-employee')
  }, {
    id: 'view-people',
    label: 'View People',
    description: 'Manage your team',
    tooltip: 'View and manage all employees',
    icon: Users,
    primary: false,
    gradient: 'from-blue-50 to-blue-25',
    action: () => navigate('/dashboard/people'),
    permission: perms => perms.canViewAllEmployees
  }];
  const filteredActions = actions.filter(action => !action.permission || action.permission(permissions));
  return <TooltipProvider>
      <Card className="shadow-sm border-0 bg-gradient-to-br from-card to-card/50">
        <CardHeader className="pb-4 p-6">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            
            Quick Actions
          </CardTitle>
          
        </CardHeader>
        
        <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 p-6 pt-0">
          {filteredActions.map(action => <Tooltip key={action.id}>
              <TooltipTrigger asChild>
                <Button variant="outline" className={`
                    h-auto p-4 justify-start group hover:shadow-lg transition-all duration-300 
                    flex-col items-start text-left min-h-[120px] border-0 relative overflow-hidden
                    ${action.primary ? 'bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/8 ring-1 ring-primary/20' : `bg-gradient-to-br ${action.gradient || 'from-muted/50 to-muted/20'} hover:from-muted/70 hover:to-muted/30`}
                    transform hover:scale-[1.02] hover:-translate-y-1
                  `} onClick={action.action}>
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-full transform translate-x-6 -translate-y-6"></div>
                  
                  {/* Icon container */}
                  <div className={`
                    p-3 rounded-xl mb-3 transition-all duration-300 group-hover:scale-110
                    ${action.primary ? 'bg-primary/20 text-primary group-hover:bg-primary/30' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'}
                  `}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 w-full">
                    <div className={`
                      font-semibold text-sm mb-1 transition-colors
                      ${action.primary ? 'text-primary' : 'text-foreground'}
                    `}>
                      {action.label}
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      {action.description}
                    </div>
                  </div>

                  {/* Primary action indicator */}
                  {action.primary && <div className="absolute top-3 right-3">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    </div>}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>{action.tooltip}</p>
              </TooltipContent>
            </Tooltip>)}
        </CardContent>
      </Card>
    </TooltipProvider>;
}