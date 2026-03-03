import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User, Role } from '../types';
import { Check, X, ShieldAlert, Shield, ShieldOff, Trash2 } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  
  useEffect(() => {
    storage.getUsers().then(setUsers);
  }, []);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updatedUser: User = { 
        ...user, 
        status: action === 'approve' ? 'active' : 'rejected' 
    };
    await storage.updateUser(updatedUser);

    // Send approval email if approved
    if (action === 'approve') {
        fetch('/api/send-approval-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: user.email, 
                name: user.firstName 
            })
        }).catch(err => console.error("Error sending approval email:", err));
    }
    
    // Refresh local list
    const updatedUsers = await storage.getUsers();
    setUsers(updatedUsers);
  };

  const handleDelete = async (userId: string, userName: string) => {
      if (userId === currentUser?.id) {
          alert("No puedes eliminar tu propia cuenta mientras estás conectado.");
          return;
      }
      if (window.confirm(`¿Estás seguro de que quieres ELIMINAR definitivamente a ${userName}? Esta acción no se puede deshacer.`)) {
          await storage.deleteUser(userId);
          const updatedUsers = await storage.getUsers();
          setUsers(updatedUsers);
      }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    if (userId === currentUser?.id) {
        alert("No puedes modificar tu propio rol.");
        return;
    }

    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Confirm action
    const actionName = newRole === 'admin' ? 'nombrar administrador a' : 'quitar permisos de administrador a';
    if (!window.confirm(`¿Estás seguro de que deseas ${actionName} ${user.firstName}?`)) {
        return;
    }

    const updatedUser: User = { ...user, role: newRole };
    await storage.updateUser(updatedUser);
    const updatedUsers = await storage.getUsers();
    setUsers(updatedUsers);
  };

  const pendingUsers = users.filter(u => u.status === 'pending_approval');
  const activeUsers = users.filter(u => u.status === 'active');

  if (currentUser?.role !== 'admin') {
      return <div className="p-4 text-red-600">Acceso Denegado.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pt-4">
      <div className="mb-8 border-b border-brand-border/50 pb-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-1">Panel de Control</h2>
        <p className="text-sm md:text-base text-brand-accent">Gestión de miembros y configuración del sistema</p>
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-brand-border/40 overflow-hidden">
        <div className="bg-[#fff9eb] p-5 border-b border-[#f0e6d2] flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
                <ShieldAlert className="text-[#b45309]" size={24}/>
                <h3 className="text-xl font-bold text-[#92400e]">Solicitudes Pendientes</h3>
            </div>
            <div className="bg-[#fcd34d] text-[#92400e] px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                {pendingUsers.length}
            </div>
        </div>
        
        {pendingUsers.length === 0 ? (
            <div className="p-12 text-center text-brand-muted/70 bg-white">
                <Shield className="mx-auto mb-4 opacity-20" size={48} />
                <p className="text-lg italic">No hay solicitudes de registro pendientes de revisión.</p>
            </div>
        ) : (
            <ul className="divide-y divide-brand-border/30">
                {pendingUsers.map(user => (
                    <li key={user.id} className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:bg-brand-light/20 transition-colors">
                        <div>
                            <p className="font-bold text-xl text-brand-dark mb-2">{user.firstName} {user.surnames.join(' ')}</p>
                            <div className="text-sm text-brand-muted space-y-1.5 font-medium">
                                <p className="flex items-center gap-2"><span className="w-20 inline-block text-brand-muted/70">Email:</span> <span className="text-brand-text">{user.email}</span></p>
                                <p className="flex items-center gap-2"><span className="w-20 inline-block text-brand-muted/70">Padres:</span> <span className="text-brand-text">{user.parentsNames}</span></p>
                                <p className="flex items-center gap-2"><span className="w-20 inline-block text-brand-muted/70">Nacimiento:</span> <span className="text-brand-text">{new Date(user.birthDate).toLocaleDateString()}</span></p>
                            </div>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                            <button 
                                onClick={() => handleAction(user.id, 'reject')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all font-bold"
                            >
                                <X size={18} /> Rechazar
                            </button>
                            <button 
                                onClick={() => handleAction(user.id, 'approve')}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-accent text-white rounded-xl hover:bg-brand-dark transition-colors shadow-md font-bold"
                            >
                                <Check size={18} /> Aprobar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-brand-border/40 overflow-hidden">
        <div className="bg-brand-light/30 p-5 border-b border-brand-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Shield className="text-brand-dark" size={24} />
                <h3 className="text-xl font-bold text-brand-dark">Miembros de la Familia</h3>
            </div>
            <div className="bg-brand-border/50 text-brand-dark px-3 py-1 rounded-full text-sm font-bold">
                {activeUsers.length}
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-brand-muted/70 uppercase tracking-wider text-xs border-b-2 border-brand-border/30">
                    <tr>
                        <th className="p-5 font-bold">Nombre y Apellidos</th>
                        <th className="p-5 font-bold">Contacto</th>
                        <th className="p-5 font-bold">Rol</th>
                        <th className="p-5 font-bold text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/30">
                    {activeUsers.map(user => (
                        <tr key={user.id} className="hover:bg-brand-light/20 transition-colors">
                            <td className="p-5">
                                <div className="font-bold text-brand-dark text-base">{user.firstName}</div>
                                <div className="text-brand-muted text-sm mt-0.5">{user.surnames.join(' ')}</div>
                            </td>
                            <td className="p-5 text-brand-text font-medium">{user.email}</td>
                            <td className="p-5">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider flex items-center gap-1.5 w-max ${user.role === 'admin' ? 'bg-[#f3e8ff] text-[#7e22ce] border border-[#e9d5ff]' : 'bg-brand-light text-brand-muted border border-brand-border/50'}`}>
                                    {user.role === 'admin' && <Shield size={12} />}
                                    {user.role === 'admin' ? 'ADMINISTRADOR' : 'MIEMBRO'}
                                </span>
                            </td>
                            <td className="p-5 text-right flex justify-end gap-3">
                                {user.id !== currentUser?.id && (
                                    <>
                                        {user.role === 'member' ? (
                                            <button
                                                onClick={() => handleRoleChange(user.id, 'admin')}
                                                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-[#f3e8ff] text-[#7e22ce] hover:bg-[#e9d5ff] rounded-xl transition-colors font-bold shadow-sm"
                                                title="Nombrar Administrador"
                                            >
                                                <Shield size={14} /> Hacer Admin
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRoleChange(user.id, 'member')}
                                                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-brand-light text-brand-muted hover:bg-brand-border/50 hover:text-brand-dark rounded-xl transition-colors font-bold shadow-sm"
                                                title="Quitar permisos de Administrador"
                                            >
                                                <ShieldOff size={14} /> Quitar Admin
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => handleDelete(user.id, user.firstName)}
                                            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors font-bold shadow-sm"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 size={14} /> Eliminar
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
