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
    <div className="min-h-screen bg-family-50 flex flex-col md:flex-row w-full">
      {/* Mobile Header */}
      <div className="md:hidden bg-turquoise-700 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md w-full">
        <h1 className="text-xl font-bold font-serif">FAMILIA MAZARRASA</h1>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-turquoise-600 text-white transform transition-transform duration-300 ease-in-out shadow-xl
        md:relative md:translate-x-0 md:block
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-xl font-bold font-serif mb-1">FAMILIA MAZARRASA</h1>
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
                  ? 'bg-turquoise-700 text-white font-medium shadow-sm' 
                  : 'hover:bg-turquoise-500 text-turquoise-50'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-turquoise-700">
          <button 
             onClick={() => {
                onNavigate('profile');
                setSidebarOpen(false);
             }}
             className={`flex items-center space-x-3 mb-4 px-2 w-full text-left rounded p-2 transition
                ${activePage === 'profile' ? 'bg-turquoise-700' : 'hover:bg-turquoise-700'}
             `}
          >
            <div className="w-8 h-8 rounded-full bg-turquoise-400 flex items-center justify-center text-white font-bold">
              {currentUser?.firstName.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate">{currentUser?.firstName}</p>
              <div className="flex items-center gap-1 text-xs text-turquoise-200">
                <UserCircle size={10} />
                <span>Mi Perfil</span>
              </div>
            </div>
          </button>

          <button 
            onClick={logout}
            className="w-full flex items-center space-x-2 text-turquoise-100 hover:text-white px-2 py-2 rounded hover:bg-turquoise-700 transition-colors"
          >
            <LogOut size={18} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 w-full overflow-y-auto overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
           {children}
        </div>
      </main>
    </div>
  );
};
