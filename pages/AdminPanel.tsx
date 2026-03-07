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
        status: action === 'approve' ? 'active' : 'rejected',
        rejectedAt: action === 'reject' ? new Date().toISOString() : user.rejectedAt
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
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  if (currentUser?.role !== 'admin') {
      return <div className="p-4 text-red-600">Acceso Denegado.</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-serif font-bold text-family-900 border-b border-family-200 pb-4">Administración</h2>

      <div className="bg-white rounded-xl shadow-sm border border-family-200 overflow-hidden">
        <div className="bg-amber-50 p-4 border-b border-amber-100 flex items-center gap-2">
            <ShieldAlert className="text-amber-600" size={20}/>
            <h3 className="text-lg font-bold text-amber-800">Solicitudes Pendientes ({pendingUsers.length})</h3>
        </div>
        
        {pendingUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No hay solicitudes pendientes.</div>
        ) : (
            <ul className="divide-y divide-slate-100">
                {pendingUsers.map(user => (
                    <li key={user.id} className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <p className="font-bold text-lg text-slate-800">{user.firstName} {user.surnames?.join(' ') || ''}</p>
                            <div className="text-sm text-slate-600 space-y-1 mt-1">
                                <p>Email: {user.email}</p>
                                <p>Padres: {user.parentsNames}</p>
                                <p>Fecha Nacimiento: {user.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'N/A'}</p>
                                <p>Registrado: {user.registeredAt ? new Date(user.registeredAt).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleAction(user.id, 'reject')}
                                className="flex items-center gap-1 px-3 py-2 border border-amber-200 text-amber-700 rounded hover:bg-amber-50 transition"
                                title="Rechazar solicitud"
                            >
                                <X size={16} /> Rechazar
                            </button>
                            <button 
                                onClick={() => handleAction(user.id, 'approve')}
                                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition shadow-sm"
                                title="Aprobar solicitud"
                            >
                                <Check size={16} /> Aprobar
                            </button>
                            <button
                                onClick={() => handleDelete(user.id, user.firstName)}
                                className="flex items-center gap-1 px-3 py-2 border border-red-200 text-red-700 rounded hover:bg-red-50 transition"
                                title="Eliminar solicitud"
                            >
                                <Trash2 size={16} /> Eliminar
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        )}
      </div>

      {rejectedUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-family-200 overflow-hidden">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
                <X className="text-red-600" size={20}/>
                <h3 className="text-lg font-bold text-red-800">Solicitudes Rechazadas ({rejectedUsers.length})</h3>
            </div>
            <ul className="divide-y divide-slate-100">
                {rejectedUsers.map(user => (
                    <li key={user.id} className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <p className="font-bold text-lg text-slate-800">{user.firstName} {user.surnames?.join(' ') || ''}</p>
                            <div className="text-sm text-slate-600 space-y-1 mt-1">
                                <p>Email: {user.email}</p>
                                <p>Fecha Rechazo: {user.rejectedAt ? new Date(user.rejectedAt).toLocaleString() : 'N/A'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAction(user.id, 'approve')}
                                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition shadow-sm"
                            >
                                <Check size={16} /> Aprobar de nuevo
                            </button>
                            <button
                                onClick={() => handleDelete(user.id, user.firstName)}
                                className="flex items-center gap-1 px-3 py-2 border border-red-200 text-red-700 rounded hover:bg-red-50 transition"
                            >
                                <Trash2 size={16} /> Eliminar Definitivamente
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-family-200 overflow-hidden">
        <div className="bg-slate-50 p-4 border-b border-slate-100">
            <h3 className="text-lg font-bold text-slate-700">Miembros Activos ({activeUsers.length})</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                    <tr>
                        <th className="p-4 font-medium">Nombre</th>
                        <th className="p-4 font-medium">Apellidos</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Rol</th>
                        <th className="p-4 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {activeUsers.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50">
                            <td className="p-4 text-slate-900">{user.firstName}</td>
                            <td className="p-4 text-slate-600">{user.surnames?.join(' ') || ''}</td>
                            <td className="p-4 text-slate-600">{user.email}</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {user.role === 'admin' ? 'Administrador' : 'Miembro'}
                                </span>
                            </td>
                            <td className="p-4 text-right flex justify-end gap-2">
                                {user.id !== currentUser?.id && (
                                    <>
                                        {user.role === 'member' ? (
                                            <button
                                                onClick={() => handleRoleChange(user.id, 'admin')}
                                                className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full transition font-medium"
                                                title="Nombrar Administrador"
                                            >
                                                <Shield size={14} /> Hacer Admin
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleRoleChange(user.id, 'member')}
                                                className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition font-medium"
                                                title="Quitar permisos de Administrador"
                                            >
                                                <ShieldOff size={14} /> Quitar Admin
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => handleDelete(user.id, user.firstName)}
                                            className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-full transition font-medium"
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