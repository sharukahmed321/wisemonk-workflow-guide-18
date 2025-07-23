
import { useAuth } from '@/contexts/AuthContext';
import { AuthSection } from '@/components/AuthSection';
import { Dashboard } from '@/components/Dashboard';
import { BrandingSection } from '@/components/BrandingSection';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Routes, Route } from 'react-router-dom';
import Settings from './Settings';

export default function Index() {
  const { user, loading } = useAuth();

  const handleSignInComplete = () => {
    // Auth context will handle the state update
    console.log('Sign in completed');
  };

  const handleSignUpComplete = () => {
    // Auth context will handle the state update
    console.log('Sign up completed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen">
            <BrandingSection />
            <AuthSection 
              onSignInComplete={handleSignInComplete}
              onSignUpComplete={handleSignUpComplete}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}
