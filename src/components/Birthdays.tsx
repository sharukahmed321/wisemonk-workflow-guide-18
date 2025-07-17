import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Cake } from "lucide-react";
import { mockEmployees } from '@/data/employees';

interface BirthdayEmployee {
  id: string;
  name: string;
  date: string;
  avatar?: string;
  initials: string;
  daysUntil: number;
}

const getUpcomingBirthdays = (): BirthdayEmployee[] => {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  return mockEmployees
    .filter(employee => employee.birthday && employee.status === 'Active')
    .map(employee => {
      const [month, day] = employee.birthday!.split('-').map(Number);
      let birthdayThisYear = new Date(currentYear, month - 1, day);
      
      // If birthday has passed this year, consider next year's birthday
      if (birthdayThisYear < today) {
        birthdayThisYear = new Date(currentYear + 1, month - 1, day);
      }
      
      const daysUntil = Math.ceil((birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let dateLabel = '';
      if (daysUntil === 0) dateLabel = 'Today';
      else if (daysUntil === 1) dateLabel = 'Tomorrow';
      else if (daysUntil <= 7) dateLabel = `${daysUntil} days`;
      else dateLabel = birthdayThisYear.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      return {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        date: dateLabel,
        avatar: employee.avatar,
        initials: `${employee.firstName[0]}${employee.lastName[0]}`,
        daysUntil
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 5); // Show next 5 birthdays
};

export function Birthdays() {
  const upcomingBirthdays = getUpcomingBirthdays();

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-4 p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <div className="p-1 rounded-lg bg-primary/10">
              <Cake className="h-3.5 w-3.5 text-primary" />
            </div>
            Birthdays
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {upcomingBirthdays.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-6 pt-0">
        {upcomingBirthdays.length > 0 ? (
          upcomingBirthdays.map((employee) => (
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
  );
}