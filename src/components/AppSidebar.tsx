import React from 'react';
import {
  Home as HomeIcon,
  Settings as SettingsIcon,
  LayoutDashboard as LayoutDashboardIcon,
  ImageIcon,
  LucideIcon,
  PackageIcon,
  Plus,
  KanbanSquare,
  Calendar,
  HelpCircle,
  LogOut,
} from 'lucide-react';

import { Users, Settings, Home, Building, FileText, UserPlus } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavItem[];
}

interface SidebarProps {
  data: {
    navMain: NavItem[];
  };
}

export function AppSidebar() {
  const location = useLocation();
  
  const data = {
    navMain: [
      {
        title: 'Dashboard',
        url: '/dashboard',
        icon: Home,
        items: []
      },
      {
        title: 'People',
        url: '/dashboard/people',
        icon: Users,
        items: [
          {
            title: 'All People',
            url: '/dashboard/people',
          },
          {
            title: 'Add Employee',
            url: '/dashboard/people/add',
          }
        ]
      },
      {
        title: 'Organization',
        url: '/dashboard/organization',
        icon: Building,
        items: []
      },
      {
        title: 'Documents',
        url: '/dashboard/documents',
        icon: FileText,
        items: []
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: Settings,
        items: []
      }
    ]
  };

  return (
    <Sidebar orientation="left">
      <SidebarRail>
        <SidebarMenuButton />
      </SidebarRail>
      <SidebarContent>
        <SidebarHeader>
          <div className="flex items-center space-x-2">
            <span className="font-bold">HR App</span>
          </div>
        </SidebarHeader>
        <SidebarMenu>
          {data.navMain.map((group, i) => (
            <SidebarGroup key={i}>
              {group.items && group.items.length > 0 ? (
                <>
                  <SidebarMenuItem href={group.url} isActive={location.pathname === group.url} icon={group.icon}>
                    {group.title}
                  </SidebarMenuItem>
                  {group.items.map((item, j) => (
                    <SidebarMenuSub key={j}>
                      <SidebarMenuSubButton>{item.title}</SidebarMenuSubButton>
                      <SidebarGroupContent>
                        <SidebarMenuSubItem href={item.url} isActive={location.pathname === item.url}>
                          {item.title}
                        </SidebarMenuSubItem>
                      </SidebarGroupContent>
                    </SidebarMenuSub>
                  ))}
                </>
              ) : (
                <SidebarMenuItem href={group.url} isActive={location.pathname === group.url} icon={group.icon}>
                  {group.title}
                </SidebarMenuItem>
              )}
            </SidebarGroup>
          ))}
        </SidebarMenu>
        <SidebarFooter>
          <div className="flex items-center space-x-2">
            <span className="text-sm">© 2023 HR App</span>
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
