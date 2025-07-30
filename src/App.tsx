
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import { Dashboard } from './components/Dashboard';
import NotFound from './pages/NotFound';
import InvitationPage from './pages/InvitationPage';
import StandalonePreboardingPage from './pages/StandalonePreboarding';
import PreboardingCompletePage from './pages/PreboardingComplete';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/invite/:token" element={<InvitationPage />} />
        <Route path="/preboarding/:employeeId" element={<StandalonePreboardingPage />} />
        <Route path="/preboarding-complete" element={<PreboardingCompletePage />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
