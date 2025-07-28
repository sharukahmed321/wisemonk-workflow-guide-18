import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Overview from './components/Overview';
import People from './pages/People';
import Settings from './pages/Settings';
import AddEmployeeForm from './pages/AddEmployeeForm';
import NotFound from './pages/NotFound';
import EmployeeProfilePage from './pages/EmployeeProfile';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />}>
          <Route index element={<Overview />} />
          <Route path="people" element={<People />} />
          <Route path="people/:id" element={<EmployeeProfilePage />} />
          <Route path="people/add" element={<AddEmployeeForm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
