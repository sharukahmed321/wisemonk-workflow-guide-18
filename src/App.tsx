
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Index from '@/pages/Index';
import People from '@/pages/People';
import { AddEmployeeTwoStepForm } from '@/components/AddEmployeeTwoStepForm';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import './App.css';

const queryClient = new QueryClient();

function PeopleLayout() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Please log in to access this page</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <Routes>
            <Route path="/" element={<People />} />
            <Route path="/add" element={<AddEmployeeTwoStepForm />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/dashboard/*" element={<Index />} />
            <Route path="/dashboard/people/*" element={<PeopleLayout />} />
            <Route path="/" element={<Index />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
