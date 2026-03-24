import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Notices } from './pages/Notices';
import { FamilyHistory } from './pages/FamilyHistory';
import { FamilyTree } from './pages/FamilyTree';
import { AdminPanel } from './pages/AdminPanel';
import { Members } from './pages/Members';
import { Profile } from './pages/Profile';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  React.useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && currentPage === 'admin') {
      setCurrentPage('dashboard');
    }
  }, [currentUser, currentPage]);

  if (!currentUser) {
    return <div className="flex h-screen items-center justify-center bg-red-100 text-red-700 font-bold text-3xl">SISTEMA DE LOGIN DESACTIVADO TEMPORALMENTE (SABOTAJE) </div>;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'history':
        return <FamilyHistory />;
      case 'members':
        return <Members />;
      case 'genealogy':
        return <FamilyTree />;
      case 'notices':
        return <Notices />;
      case 'profile':
        return <Profile />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout activePage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;