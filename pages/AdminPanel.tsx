import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User } from '../types';
import { Check, X, Trash2, ShieldAlert } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await storage.getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (action === 'approve') {
      const updatedUser: User = { ...user, status: 'active' };
      await storage.updateUser(updatedUser);

      // Send approval email
      fetch('/api/send-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.firstName })
      }).catch(err => console.error("Error sending approval email:", err));

    } else if (action === 'reject') {
      // Rejecting in this context means deleting the record as per request
      if (window.confirm(`¿Estás seguro de que deseas rechazar y ELIMINAR la solicitud de ${user.firstName}?`)) {
        await storage.deleteUser(userId);
      } else {
        return;
      }
    }
    
    await fetchUsers();
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert("No puedes eliminar tu propia cuenta desde aquí.");
      return;
    }
    if (window.confirm(`¿Estás seguro de que quieres ELIMINAR definitivamente la cuenta de ${userName}?`)) {
      await storage.deleteUser(userId);
      await fetchUsers();
    }
  };

  if (currentUser?.role !== 'admin') {
    return <div className="p-8 text-red-600 font-bold">Acceso Denegado.</div>;
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando panel de administración...</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-family-200 pb-4">
        <h2 className="text-3xl font-serif font-bold text-family-900">Panel de Administración</h2>
        <p className="text-family-600 mt-1">Gestiona las solicitudes de acceso y miembros de la plataforma.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-family-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-bold text-slate-700">Nombre</th>
                <th className="p-4 font-bold text-slate-700">Email</th>
                <th className="p-4 font-bold text-slate-700">Estado</th>
                <th className="p-4 font-bold text-slate-700 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-slate-900">{user.firstName} {user.surnames[0]}</div>
                    <div className="text-xs text-slate-500">{user.role === 'admin' ? 'Administrador' : 'Miembro'}</div>
                  </td>
                  <td className="p-4 text-slate-600">{user.email}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status === 'active' ? 'Aprobado' :
                       user.status === 'pending_approval' ? 'Pendiente' : 'Rechazado'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {user.status === 'pending_approval' ? (
                        <>
                          <button
                            onClick={() => handleAction(user.id, 'approve')}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-sm"
                            title="Aprobar"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => handleAction(user.id, 'reject')}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                            title="Rechazar (Borrar)"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(user.id, user.firstName)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition text-sm font-medium"
                          >
                            <Trash2 size={16} />
                            <span>Eliminar cuenta</span>
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    No hay usuarios registrados en la base de datos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {users.some(u => u.status === 'pending_approval') && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex gap-3 items-start">
          <ShieldAlert className="text-amber-600 flex-shrink-0" size={20} />
          <div>
            <p className="text-sm text-amber-800 font-medium">Hay solicitudes pendientes de aprobación.</p>
            <p className="text-xs text-amber-700 mt-1">Los usuarios pendientes no pueden acceder a la plataforma hasta que sean aprobados.</p>
          </div>
        </div>
      )}
    </div>
  );
};
