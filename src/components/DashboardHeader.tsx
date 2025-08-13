import React, { useState, useEffect } from 'react';
import { Search, Settings, ChevronDown, LogOut, User, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function DashboardHeader() {
  const navigate = useNavigate();
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Failed to fetch profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out successfully",
        description: "You have been securely signed out.",
      });
      navigate('/', { replace: true });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getUserInitials = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name[0]}${userProfile.last_name[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    }
    if (userProfile?.first_name) {
      return userProfile.first_name;
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'manager': return 'default';
      case 'employee': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <header className="h-12 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-3 md:px-4">
      <div className="flex items-center gap-3 flex-1">
        <SidebarTrigger />
        
        <div className="hidden md:block">
          <p className="text-xs text-muted-foreground">
            Welcome back, {getUserDisplayName()}!
          </p>
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

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 h-auto p-1.5">
              <Avatar className="h-7 w-7">
                <AvatarImage src={userProfile?.avatar_url || ''} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-xs font-medium">{getUserDisplayName()}</p>
                {userRole && (
                  <Badge variant={getRoleColor(userRole)} className="text-xs h-4 px-1">
                    {userRole}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{getUserDisplayName()}</span>
                <span className="text-xs text-muted-foreground font-normal">{user?.email}</span>
                {userRole && (
                  <Badge variant={getRoleColor(userRole)} className="text-xs h-4 px-1 w-fit mt-1">
                    <Shield className="h-3 w-3 mr-1" />
                    {userRole}
                  </Badge>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              <User className="mr-2 h-4 w-4" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
