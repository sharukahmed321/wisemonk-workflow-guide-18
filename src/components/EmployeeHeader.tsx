
import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from './Logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function EmployeeHeader() {
  const {
    user,
    signOut
  } = useAuth();
  const userInitials = user?.email ? user.email.split('@')[0].slice(0, 2).toUpperCase() : 'U';
  
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Logo />
        <span className="font-bold text-lg text-foreground">Wisemonk</span>
      </div>

      {/* User Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.user_metadata?.avatar_url} alt="Profile" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium text-sm text-foreground">
                {user?.user_metadata?.first_name && user?.user_metadata?.last_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}` : user?.email?.split('@')[0]}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut('manual')} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
