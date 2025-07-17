import React from 'react';
import { Search, Bell, Settings, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
export function DashboardHeader() {
  const navigate = useNavigate();
  return <header className="h-12 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-3 md:px-4">
      <div className="flex items-center gap-3 flex-1">
        <SidebarTrigger />
        
        <div className="hidden md:block">
          
          <p className="text-xs text-muted-foreground">Welcome back, Sarah!</p>
        </div>
        
        {/* Search */}
        <div className="relative max-w-sm flex-1 ml-auto md:ml-6">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search employees..." className="pl-8 h-8 bg-background/60 border-border/60 text-sm" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Settings */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/settings')}>
          <Settings className="h-3.5 w-3.5" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-3.5 w-3.5" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
            3
          </Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 h-auto p-1.5">
              <Avatar className="h-7 w-7">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616c4b26e86?w=100&h=100&fit=crop&crop=face" />
                <AvatarFallback>SJ</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium">Sarah Johnson</p>
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              Team Management
            </DropdownMenuItem>
            <DropdownMenuItem>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>;
}