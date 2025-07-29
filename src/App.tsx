
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import { Dashboard } from './components/Dashboard';
import Overview from './components/Overview';
import People from './pages/People';
import Settings from './pages/Settings';
import { AddEmployeeTwoStepForm } from './components/AddEmployeeTwoStepForm';
import NotFound from './pages/NotFound';
import EmployeeProfilePage from './pages/EmployeeProfile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
