import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink } from 'lucide-react';
import { getUpcomingHolidays } from '@/data/publicHolidays';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';

export function PublicHolidays() {
  const upcomingHolidays = getUpcomingHolidays(4);

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isThisWeek(date)) return 'This Week';
    if (isThisMonth(date)) return 'This Month';
    return format(date, 'MMM dd');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'National': return 'bg-primary/10 text-primary';
      case 'Regional': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Religious': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card>
      <CardHeader className="pb-4 p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Public Holidays
          </CardTitle>
          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            View All
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {upcomingHolidays.length > 0 ? (
          <div className="space-y-0">
            {upcomingHolidays.map((holiday, index) => {
              const holidayDate = new Date(holiday.date);
              const daysUntil = getDaysUntil(holidayDate);
              
              return (
                <div 
                  key={holiday.id}
                  className={`px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors ${
                    index !== upcomingHolidays.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm text-foreground truncate">
                        {holiday.name}
                      </h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs px-2 py-0.5 ${getTypeColor(holiday.type)}`}
                      >
                        {holiday.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{getDateLabel(holidayDate)}</span>
                      {daysUntil === 0 && (
                        <span className="text-primary font-medium">• Today</span>
                      )}
                      {daysUntil === 1 && (
                        <span className="text-orange-600 dark:text-orange-400 font-medium">• Tomorrow</span>
                      )}
                      {daysUntil > 1 && daysUntil <= 7 && (
                        <span className="text-blue-600 dark:text-blue-400 font-medium">• {daysUntil} days</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground ml-2">
                    {format(holidayDate, 'dd MMM')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-6 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming holidays</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}