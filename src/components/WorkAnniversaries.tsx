import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { mockEmployees } from '@/data/employees';

interface AnniversaryEmployee {
  id: string;
  name: string;
  date: string;
  avatar?: string;
  initials: string;
  years: number;
  daysUntil: number;
}

const getUpcomingAnniversaries = (): AnniversaryEmployee[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  return mockEmployees
    .filter(employee => employee.status === 'Active')
    .map(employee => {
      const startDate = new Date(employee.startDate);
      const anniversaryThisYear = new Date(currentYear, startDate.getMonth(), startDate.getDate());
      
      // If anniversary has passed this year, consider next year's anniversary
      let anniversaryDate = anniversaryThisYear;
      if (anniversaryThisYear < today) {
        anniversaryDate = new Date(currentYear + 1, startDate.getMonth(), startDate.getDate());
      }
      
      const daysUntil = Math.ceil((anniversaryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const years = anniversaryDate.getFullYear() - startDate.getFullYear();
      
      let dateLabel = '';
      if (daysUntil === 0) dateLabel = 'Today';
      else if (daysUntil === 1) dateLabel = 'Tomorrow';
      else if (daysUntil <= 7) dateLabel = `${daysUntil} days`;
      else dateLabel = anniversaryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        date: dateLabel,
        avatar: employee.avatar,
        initials: `${employee.firstName[0]}${employee.lastName[0]}`,
        years,
        daysUntil
      };
    })
    .filter(emp => emp.daysUntil <= 90) // Show anniversaries within next 3 months
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5); // Show next 5 anniversaries
};

export function WorkAnniversaries() {
  const upcomingAnniversaries = getUpcomingAnniversaries();

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-4 p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <div className="p-1 rounded-lg bg-primary/10">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            Work Anniversaries
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {upcomingAnniversaries.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-6 pt-0">
        {upcomingAnniversaries.length > 0 ? (
          upcomingAnniversaries.map((employee) => (
            <div key={employee.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={employee.avatar} alt={employee.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {employee.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm text-foreground">{employee.name}</p>
                  <p className="text-xs text-muted-foreground">{employee.years} year{employee.years !== 1 ? 's' : ''}</p>
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
  );
}