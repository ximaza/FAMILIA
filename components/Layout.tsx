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
    <div className="min-h-screen bg-brand-light flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-brand-dark text-white p-4 flex justify-between items-center sticky top-0 z-50 rounded-b-xl shadow-md mx-2 mt-2">
        <h1 className="text-lg font-bold font-serif tracking-wide uppercase">FAMILIA MAZARRASA</h1>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="focus:outline-none hover:text-brand-border transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-brand-dark text-white transform transition-transform duration-300 ease-in-out shadow-2xl
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-brand-accent/30">
          <h1 className="text-xl font-bold font-serif tracking-widest uppercase text-center">FAMILIA MAZARRASA</h1>
        </div>

        <nav className="mt-6 px-4 space-y-2 flex-1 overflow-y-auto pb-32">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                ${activePage === item.id 
                  ? 'bg-brand-accent text-white font-medium shadow-card'
                  : 'hover:bg-brand-accent/50 text-brand-border'}
              `}
            >
              <span className={activePage === item.id ? 'text-white' : 'text-brand-border'}>
                {item.icon}
              </span>
              <span className="text-sm tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 bg-brand-dark border-t border-brand-accent/30">
          <button 
             onClick={() => {
                onNavigate('profile');
                setSidebarOpen(false);
             }}
             className={`flex items-center space-x-3 mb-4 px-3 w-full text-left rounded-xl py-3 transition-all duration-200
                ${activePage === 'profile' ? 'bg-brand-accent shadow-card' : 'hover:bg-brand-accent/50'}
             `}
          >
            <div className="w-10 h-10 rounded-full bg-brand-light text-brand-dark flex items-center justify-center font-bold text-lg shadow-inner">
              {currentUser?.firstName.charAt(0)}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold truncate text-white">{currentUser?.firstName}</p>
              <div className="flex items-center gap-1 text-xs text-brand-border mt-0.5">
                <UserCircle size={12} />
                <span>Mi Perfil</span>
              </div>
            </div>
          </button>

          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 text-brand-border hover:text-white px-3 py-3 rounded-xl hover:bg-red-500/20 hover:text-red-100 transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-[100vw] overflow-x-hidden">
        <div className="max-w-4xl mx-auto pb-20 md:pb-0">
           {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};