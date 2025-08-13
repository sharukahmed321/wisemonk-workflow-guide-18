
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, User, Settings
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
export function Logo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-8 h-8 text-primary"
    >
      <path
        d="M2.87598 20.729C6.82298 29.7 13.5 48 17.394 48C21.642 48 28.957 17.94 34.094 19.652C38.342 21.068 42.755 48 46.294 48C49.833 48 51.73 22.867 52.084 15.08M52.084 15.08L48.806 17.33L53.146 8L55.624 18.619L52.084 15.08Z"
        stroke="currentColor"
        strokeWidth="5"
        strokeMiterlimit="16"
        className="logo_mark"
      />
    </svg>
  );
}

const navigationItems = [
  { id: 'home', label: 'My Dashboard', icon: Home, url: '/dashboard' },
  { id: 'profile', label: 'My Profile', icon: User, url: '/dashboard/profile' }
];

export function EmployeeSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = (path: string) =>
    isActive(path) ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="border-r">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Logo />
            {state !== "collapsed" && (
              <div>
                <span className="font-bold text-lg text-foreground">Wisemonk</span>
                <p className="text-xs text-muted-foreground">Employee Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 p-2">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavCls(item.url)}>
                        <item.icon className="h-4 w-4" />
                        {state !== "collapsed" && <span>{item.label}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <SidebarTrigger className="w-full" />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
