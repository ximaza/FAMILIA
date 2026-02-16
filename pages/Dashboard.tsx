import React from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Users, Bell, TreeDeciduous, UserCircle } from 'lucide-react';

export const Dashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const notices = storage.getNotices();
  const recentNotices = notices.slice(0, 3);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-family-900">Bienvenido, {currentUser?.firstName}</h2>
        <p className="text-family-600 mt-2">Panel de coordinación de la Familia MAZ</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
            onClick={() => onNavigate('genealogy')}
            className="bg-white p-6 rounded-xl shadow-sm border border-family-200 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-family-100 text-family-700 rounded-lg group-hover:bg-family-700 group-hover:text-white transition">
              <TreeDeciduous size={24} />
            </div>
            <h3 className="text-xl font-semibold text-family-900">Árbol Genealógico</h3>
          </div>
          <p className="text-slate-600 text-sm">Explora tus raíces y conecta con antepasados en Geneanet.</p>
        </div>

        <div 
            onClick={() => onNavigate('notices')}
            className="bg-white p-6 rounded-xl shadow-sm border border-family-200 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-family-100 text-family-700 rounded-lg group-hover:bg-family-700 group-hover:text-white transition">
              <Bell size={24} />
            </div>
            <h3 className="text-xl font-semibold text-family-900">Tablón de Avisos</h3>
          </div>
          <p className="text-slate-600 text-sm">Hay {notices.length} avisos publicados. Mantente informado de eventos y noticias.</p>
        </div>

        <div 
          onClick={() => onNavigate('profile')}
          className="bg-white p-6 rounded-xl shadow-sm border border-family-200 hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-family-100 text-family-700 rounded-lg group-hover:bg-family-700 group-hover:text-white transition">
              <UserCircle size={24} />
            </div>
            <h3 className="text-xl font-semibold text-family-900">Mi Perfil</h3>
          </div>
          <div className="text-sm text-slate-600 space-y-1">
            <p className="truncate"><strong>Apellidos:</strong> {currentUser?.surnames.join(' ')}</p>
            <p className="text-family-600 mt-2 text-xs font-bold uppercase">Ver / Editar datos</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-serif font-bold text-family-800 mb-4">Avisos Recientes</h3>
        {recentNotices.length === 0 ? (
          <p className="text-slate-500 italic">No hay avisos recientes.</p>
        ) : (
          <div className="space-y-4">
            {recentNotices.map(notice => (
              <div key={notice.id} className="bg-white p-5 rounded-lg border-l-4 border-family-500 shadow-sm">
                 <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-slate-800">{notice.title}</h4>
                    <span className="text-xs text-slate-400">{new Date(notice.date).toLocaleDateString()}</span>
                 </div>
                 <p className="text-slate-600 mt-2 line-clamp-2">{notice.content}</p>
                 <button 
                    onClick={() => onNavigate('notices')}
                    className="text-family-600 text-sm font-medium mt-2 hover:underline"
                 >
                    Leer más
                 </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};