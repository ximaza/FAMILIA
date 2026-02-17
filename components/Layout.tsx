import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, Home, Users, BookOpen, Bell, Settings, LogOut, TreeDeciduous, UserCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activePage, onNavigate }) => {
  const { currentUser, logout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // New Order: INICIO, HISTORIA FAMILIAR, FAMILY, ARBOL GENEALOGICO, COMUNICACIONES, ADMIN
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: <Home size={20} /> },
    { id: 'history', label: 'Historia Familiar', icon: <BookOpen size={20} /> },
    { id: 'members', label: 'Family', icon: <Users size={20} /> },
    { id: 'genealogy', label: 'Árbol Genealógico', icon: <TreeDeciduous size={20} /> },
    { id: 'notices', label: 'Comunicaciones', icon: <Bell size={20} /> },
  ];

  if (currentUser?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Administración', icon: <Settings size={20} /> });
  }

  return (
    <div className="min-h-screen bg-family-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-family-800 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <h1 className="text-xl font-bold font-serif">FAMILIA MAZARRASA</h1>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-family-900 text-family-100 transform transition-transform duration-300 ease-in-out shadow-xl
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-xl font-bold font-serif mb-1">FAMILIA MAZARRASA</h1>
          <p className="text-xs text-family-300 uppercase tracking-widest">Coordinadora</p>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                ${activePage === item.id 
                  ? 'bg-family-700 text-white font-medium shadow-sm' 
                  : 'hover:bg-family-800 text-family-200'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-family-800">
          <button 
             onClick={() => {
                onNavigate('profile');
                setSidebarOpen(false);
             }}
             className={`flex items-center space-x-3 mb-4 px-2 w-full text-left rounded p-2 transition
                ${activePage === 'profile' ? 'bg-family-800' : 'hover:bg-family-800'}
             `}
          >
            <div className="w-8 h-8 rounded-full bg-family-500 flex items-center justify-center text-white font-bold">
              {currentUser?.firstName.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">{currentUser?.firstName}</p>
              <div className="flex items-center gap-1 text-xs text-family-400">
                <UserCircle size={10} />
                <span>Mi Perfil</span>
              </div>
            </div>
          </button>

          <button 
            onClick={logout}
            className="w-full flex items-center space-x-2 text-family-300 hover:text-white px-2 py-2 rounded hover:bg-family-800 transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
           {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};