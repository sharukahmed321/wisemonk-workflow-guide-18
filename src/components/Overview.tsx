import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { X, Search, Bell, Settings, ChevronDown, Calendar, Download, Users, MessageSquare, Briefcase, HelpCircle, Plus, ArrowRight, TrendingUp, TrendingDown, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import svgPaths from "../imports/svg-nfr2pk9dzf";

// Image URLs from user
const images = {
  defaultAvatar: "https://images.unsplash.com/photo-1494790108755-2616c4b26e86?w=100&h=100&fit=crop&crop=face",
  avatar1: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  avatar2: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face",
  bannerIllustration: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop",
};

interface SvgIconProps {
  path: string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({ path, className = "w-5 h-5", fill = "currentColor", stroke, strokeWidth = "2" }) => (
  <svg className={className} fill={stroke ? "none" : fill} stroke={stroke} strokeWidth={strokeWidth} viewBox="0 0 20 20">
    <path d={path} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Sidebar = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('general');

  const sidebarSections = [
    {
      title: "General",
      key: "general",
      items: [
        { name: "Dashboard", icon: <SvgIcon path={svgPaths.p15e23cf0} />, active: true },
        { name: "Analytics", icon: <SvgIcon path={svgPaths.p1b3ad500} /> },
        { name: "Customer", icon: <SvgIcon path={svgPaths.p1325c300} /> },
        { name: "Order", icon: <SvgIcon path={svgPaths.p3700b500} /> },
        { name: "Crypto", icon: <SvgIcon path={svgPaths.p11909d20} /> },
      ]
    },
    {
      title: "Management",
      key: "management",
      items: [
        { name: "Employee", icon: <SvgIcon path={svgPaths.p2d25d100} /> },
        { name: "Company", icon: <SvgIcon path={svgPaths.p14844b80} /> },
        { name: "Business", icon: <SvgIcon path={svgPaths.p3ea84f00} /> },
      ]
    },
    {
      title: "Platforms",
      key: "platforms",
      items: [
        { name: "API Platforms", icon: <SvgIcon path={svgPaths.p15e3b800} /> },
        { name: "Storage", icon: <SvgIcon path={svgPaths.p16762500} /> },
        { name: "Hosting", icon: <SvgIcon path={svgPaths.pa356280} /> },
      ]
    },
    {
      title: "Apps",
      key: "apps",
      items: [
        { name: "Chat", icon: <SvgIcon path={svgPaths.p17382080} /> },
        { name: "Mail", icon: <SvgIcon path={svgPaths.p1f7e7900} /> },
        { name: "Calendar", icon: <SvgIcon path={svgPaths.p1fb4cc00} /> },
      ]
    },
    {
      title: "Pages",
      key: "pages",
      items: [
        { name: "Help Center", icon: <SvgIcon path={svgPaths.pf74b800} /> },
        { name: "Settings", icon: <SvgIcon path={svgPaths.p21c593f0} /> },
      ]
    }
  ];

  return (
    <div className="w-64 bg-card border-r border-border h-full">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <SvgIcon path={svgPaths.p14844b80} className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-foreground font-bold text-xl">Wisemonk</span>
        </div>
      </div>
      
      <nav className="px-4 space-y-2">
        {sidebarSections.map((section) => (
          <div key={section.key}>
            <button
              onClick={() => setExpandedSection(expandedSection === section.key ? null : section.key)}
              className="w-full flex items-center justify-between px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-sm font-medium">{section.title}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${expandedSection === section.key ? 'rotate-180' : ''}`} />
            </button>
            {expandedSection === section.key && (
              <div className="ml-3 space-y-1">
                {section.items.map((item) => (
                  <button
                    key={item.name}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      item.active 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm">{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

const DashboardHeader = () => (
  <header className="bg-card border-b border-border px-6 py-4">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Good morning</h1>
        <p className="text-muted-foreground">Here's what's happening at your company today.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-10 w-64" />
        </div>
        <Button variant="outline" size="sm">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
        </Button>
        <Avatar>
          <AvatarImage src={images.defaultAvatar} />
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      </div>
    </div>
  </header>
);

const BannerCard = () => {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="p-6">
        <button 
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to your dashboard!</h3>
            <p className="text-muted-foreground mb-4">
              Try our new feature to manage your HR processes more efficiently.
            </p>
            <Button>
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <div className="flex-shrink-0">
            <img 
              src={images.bannerIllustration} 
              alt="Dashboard illustration" 
              className="w-32 h-24 object-cover rounded-lg"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const DonutChart = ({ percentage, color, size = 120 }: { percentage: number; color: string; size?: number }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r="45"
          stroke="hsl(var(--muted))"
          strokeWidth="10"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r="45"
          stroke={color}
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{percentage}%</span>
      </div>
    </div>
  );
};

const FinancialCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">My Wallet</CardTitle>
            <CardDescription>Crypto wallet</CardDescription>
          </div>
          <div className="p-2 bg-orange-100 rounded-lg">
            <SvgIcon path={svgPaths.p11909d20} className="w-5 h-5 text-orange-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">$4,033</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500 text-sm">+2.5%</span>
              <span className="text-muted-foreground text-sm">from last month</span>
            </div>
          </div>
          <DonutChart percentage={68} color="hsl(var(--primary))" />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Saving Wallet</CardTitle>
            <CardDescription>Traditional savings</CardDescription>
          </div>
          <div className="p-2 bg-green-100 rounded-lg">
            <SvgIcon path={svgPaths.p3ea84f00} className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">$12,750</p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-red-500 text-sm">-0.8%</span>
              <span className="text-muted-foreground text-sm">from last month</span>
            </div>
          </div>
          <DonutChart percentage={45} color="#22c55e" />
        </div>
      </CardContent>
    </Card>
  </div>
);

const AnalyticsChart = () => {
  const data = [
    { name: 'Jan', value: 65 },
    { name: 'Feb', value: 80 },
    { name: 'Mar', value: 55 },
    { name: 'Apr', value: 90 },
    { name: 'May', value: 70 },
    { name: 'Jun', value: 85 },
    { name: 'Jul', value: 95 },
    { name: 'Aug', value: 75 },
    { name: 'Sep', value: 88 },
    { name: 'Oct', value: 92 },
    { name: 'Nov', value: 78 },
    { name: 'Dec', value: 85 },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction Analytics</CardTitle>
            <CardDescription>Monthly transaction overview</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Last 12 months
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-64 gap-2">
          {data.map((item, index) => (
            <div key={index} className="flex flex-col items-center gap-2 flex-1">
              <div 
                className="bg-primary rounded-t w-full transition-all duration-300 hover:opacity-80"
                style={{ height: `${item.value}%` }}
              />
              <span className="text-xs text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Confirmed': return 'bg-green-100 text-green-800';
    case 'On Hold': return 'bg-yellow-100 text-yellow-800';
    case 'Failed': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Confirmed': return <CheckCircle className="h-4 w-4" />;
    case 'On Hold': return <Clock className="h-4 w-4" />;
    case 'Failed': return <XCircle className="h-4 w-4" />;
    default: return <AlertCircle className="h-4 w-4" />;
  }
};

const TransactionTable = () => {
  const transactions = [
    { id: '001', description: 'Salary Payment - John Doe', amount: '$3,200', date: '2024-01-15', status: 'Confirmed' },
    { id: '002', description: 'Office Supplies', amount: '$247', date: '2024-01-14', status: 'On Hold' },
    { id: '003', description: 'Marketing Campaign', amount: '$1,850', date: '2024-01-13', status: 'Failed' },
    { id: '004', description: 'Software License', amount: '$599', date: '2024-01-12', status: 'Confirmed' },
    { id: '005', description: 'Travel Expenses', amount: '$432', date: '2024-01-11', status: 'Confirmed' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest company transactions</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-muted rounded-lg">
                  {getStatusIcon(transaction.status)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{transaction.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-foreground">{transaction.amount}</span>
                <Badge className={getStatusColor(transaction.status)}>
                  {transaction.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ChatInbox = () => {
  const conversations = [
    {
      id: 1,
      name: 'HR Team',
      message: 'New employee onboarding documents ready',
      time: '2 min ago',
      avatars: [images.defaultAvatar, images.avatar1],
      unread: 3
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      message: 'Can we schedule a meeting for next week?',
      time: '1 hour ago',
      avatars: [images.avatar2],
      unread: 1
    },
    {
      id: 3,
      name: 'Finance Department',
      message: 'Monthly budget review completed',
      time: '3 hours ago',
      avatars: [images.defaultAvatar, images.avatar1, images.avatar2],
      unread: 0
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <CardTitle>Chat & Inbox</CardTitle>
          </div>
          <Button variant="outline" size="sm">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div key={conversation.id} className="flex items-center gap-3 p-3 hover:bg-accent rounded-lg cursor-pointer transition-colors">
              <div className="flex -space-x-2">
                {conversation.avatars.slice(0, 3).map((avatar, index) => (
                  <Avatar key={index} className="w-8 h-8 border-2 border-background">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>U{index + 1}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground truncate">{conversation.name}</p>
                  <span className="text-xs text-muted-foreground">{conversation.time}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{conversation.message}</p>
              </div>
              {conversation.unread > 0 && (
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  {conversation.unread}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const ActionCards = () => {
  const actions = [
    {
      title: 'Job Search',
      description: 'Find your perfect role with our advanced job matching algorithm',
      icon: <Briefcase className="h-5 w-5" />,
      buttonText: 'Browse Jobs',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Help Center',
      description: 'Get support and find answers to frequently asked questions',
      icon: <HelpCircle className="h-5 w-5" />,
      buttonText: 'Get Help',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Download Reports',
      description: 'Access and download your latest company reports and analytics',
      icon: <Download className="h-5 w-5" />,
      buttonText: 'Download',
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Team Contacts',
      description: 'Manage and view all your company contacts and team members',
      icon: <Users className="h-5 w-5" />,
      buttonText: 'View Contacts',
      color: 'bg-orange-50 border-orange-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {actions.map((action, index) => (
        <Card key={index} className={action.color}>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              {action.icon}
              <h3 className="font-semibold text-foreground">{action.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
            <Button size="sm" variant="outline" className="w-full">
              {action.buttonText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default function Overview() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          <BannerCard />
          <FinancialCards />
          <AnalyticsChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TransactionTable />
            <ChatInbox />
          </div>
          <ActionCards />
        </main>
      </div>
    </div>
  );
}