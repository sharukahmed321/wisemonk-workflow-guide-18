import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Cake, Calendar } from "lucide-react";

interface Employee {
  name: string;
  date: string;
  avatar?: string;
  initials: string;
}

interface Anniversary extends Employee {
  years: string;
}

const birthdays: Employee[] = [
  {
    name: 'Sarah Johnson',
    date: 'Today',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616c4b26e86?w=100&h=100&fit=crop&crop=face',
    initials: 'SJ'
  },
  {
    name: 'Mike Chen',
    date: 'Tomorrow',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    initials: 'MC'
  }
];

const anniversaries: Anniversary[] = [
  {
    name: 'John Smith',
    years: '5 years',
    date: 'Today',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    initials: 'JS'
  }
];

export function EmployeeEvents() {
  return (
    <div className="space-y-4">
      {/* Birthdays */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="p-1 rounded-lg bg-primary/10">
                <Cake className="h-3.5 w-3.5 text-primary" />
              </div>
              Birthdays
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {birthdays.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {birthdays.length > 0 ? (
            birthdays.map((employee, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {employee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">Birthday</p>
                  </div>
                </div>
                <Badge variant={employee.date === 'Today' ? 'default' : 'secondary'} className="text-xs">
                  {employee.date}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">
              No upcoming birthdays
            </p>
          )}
        </CardContent>
      </Card>

      {/* Anniversaries */}
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="p-1 rounded-lg bg-primary/10">
                <Calendar className="h-3.5 w-3.5 text-primary" />
              </div>
              Work Anniversaries
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {anniversaries.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {anniversaries.length > 0 ? (
            anniversaries.map((employee, index) => (
              <div key={index} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {employee.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm text-foreground">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">{employee.years}</p>
                  </div>
                </div>
                <Badge variant={employee.date === 'Today' ? 'default' : 'secondary'} className="text-xs">
                  {employee.date}
                </Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-3">
              No upcoming anniversaries
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}