
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { Room } from './pages/Room';
import { TeacherPlanner } from './pages/TeacherPlanner';
import { TeacherHub } from './pages/TeacherHub';
import { LoginPage } from './pages/LoginPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { WorkspaceAdminDashboard } from './pages/WorkspaceAdminDashboard';
import { InstallerPage } from './pages/InstallerPage';
import { ApiService } from './services/api';

const App: React.FC = () => {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    // Check installation status on mount
    const checkStatus = () => {
        const installed = ApiService.isInstalled();
        setIsInstalled(installed);
    };
    checkStatus();
  }, []);

  if (isInstalled === null) {
      return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!isInstalled) {
      return <InstallerPage onInstalled={() => setIsInstalled(true)} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard-legacy" element={<Dashboard />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/workspace-admin" element={<WorkspaceAdminDashboard />} />
        <Route path="/teacher-hub" element={<TeacherHub />} />
        
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/planner" element={<TeacherPlanner />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
