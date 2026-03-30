import React, { useState, useEffect, useRef } from 'react';
import { compressImage, uploadImage } from '../utils/image';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User } from '../types';
import { Save, X, Edit3, UserCircle, Trash2, Camera, Upload } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, refreshUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
        setFormData({ ...currentUser });
    }
  }, [currentUser]);

const handleSave = async () => {
    if (!currentUser || !formData.id) return;
    
    let passToUpdate = currentUser.password;
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      passToUpdate = newPassword;
    }

    const updatedUser: User = {
        ...currentUser,
        firstName: formData.firstName || currentUser.firstName,
        surnames: (formData.surnames || currentUser.surnames || ['', '', '', '']) as [string, string, string, string],
        birthDate: formData.birthDate || currentUser.birthDate,
        fatherName: formData.fatherName !== undefined ? formData.fatherName : currentUser.fatherName,
        motherName: formData.motherName !== undefined ? formData.motherName : currentUser.motherName,
        email: formData.email || currentUser.email,
        personalInfo: formData.personalInfo || '',
        password: passToUpdate,
        photoUrl: formData.photoUrl || currentUser.photoUrl
    };

    await storage.updateUser(updatedUser);
    await refreshUser();
    setIsEditing(false);
    alert('Perfil actualizado correctamente.');
  };

  const handleChangeSurname = (index: number, value: string) => {
      const newSurnames = [...(formData.surnames || ['', '', '', ''])];
      newSurnames[index] = value;
      setFormData({ ...formData, surnames: newSurnames as [string, string, string, string] });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedImage = await compressImage(file);
        const publicUrl = await uploadImage(compressedImage, "profiles");
        setFormData({ ...formData, photoUrl: publicUrl });
      } catch (error) {
        console.error("Error compressing/uploading image", error);
        alert("Hubo un error al subir la imagen. Intenta con otra.");
      }
    }
  };

  const handleDeleteAccount = async () => {
      if (!currentUser) return;
      
      const confirmText = `¿Estás completamente seguro de que deseas eliminar tu cuenta? Esta acción borrará tus datos y perderás el acceso.`;
      if (window.confirm(confirmText)) {
          await storage.deleteUser(currentUser.id);
          logout();
          alert("Tu cuenta ha sido eliminada.");
      }
  };

  if (!currentUser) return <div>Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8 border-b border-family-200 pb-4">
        <div className="flex items-center gap-4">
            <h2 className="text-3xl font-serif font-bold text-family-900">Mi Perfil</h2>
        </div>
        {!isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-family-600 text-white px-4 py-2 rounded-lg hover:bg-family-700 transition"
            >
                <Edit3 size={18} /> Editar Datos
            </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-family-200 overflow-hidden mb-8">
        
        {/* Header / Banner area with Photo */}
        <div className="bg-family-50 p-8 border-b border-family-100 flex flex-col md:flex-row items-center gap-6">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-white flex items-center justify-center">
                    {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Perfil" className="w-full h-full object-cover" />
                    ) : (
                        <UserCircle size={100} className="text-family-200" />
                    )}
                </div>
                
                {isEditing && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-family-600 text-white p-2 rounded-full hover:bg-family-700 shadow-lg transition"
                        title="Cambiar foto"
                    >
                        <Camera size={18} />
                    </button>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>
            
            <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-family-900">{formData.firstName} {formData.surnames?.[0]}</h3>
                <p className="text-family-600">{formData.email}</p>
                {isEditing && <p className="text-xs text-slate-400 mt-2">* Haz clic en la cámara para subir foto (Max 800KB)</p>}
            </div>
        </div>

        <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre</label>
                    {isEditing ? (
                        <input 
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-medium text-slate-800 border-b border-slate-100 pb-2">{currentUser.firstName}</p>
                    )}
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Fecha de Nacimiento</label>
                    {isEditing ? (
                        <input 
                            type="date"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-medium text-slate-800 border-b border-slate-100 pb-2">{currentUser.birthDate ? new Date(currentUser.birthDate).toLocaleDateString() : 'No especificada'}</p>
                    )}
                </div>

                <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Apellidos</label>
                    {isEditing ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map(idx => (
                                <input 
                                    key={idx}
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                                    placeholder={`${idx + 1}º Apellido`}
                                    value={formData.surnames?.[idx]}
                                    onChange={(e) => handleChangeSurname(idx, e.target.value)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {(currentUser.surnames || []).map((s, i) => s && (
                                <span key={i} className="bg-slate-50 border border-slate-200 px-3 py-1 rounded text-slate-700 font-medium">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>


                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre del Padre</label>
                    {isEditing ? (
                        <input
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.fatherName !== undefined ? formData.fatherName : currentUser.fatherName || ''}
                            onChange={(e) => setFormData({...formData, fatherName: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-medium text-slate-800 border-b border-slate-100 pb-2">{currentUser.fatherName || 'Desconocido'}</p>
                    )}
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nombre de la Madre</label>
                    {isEditing ? (
                        <input 
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.motherName !== undefined ? formData.motherName : currentUser.motherName || ''}
                            onChange={(e) => setFormData({...formData, motherName: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-medium text-slate-800 border-b border-slate-100 pb-2">{currentUser.motherName || 'Desconocida'}</p>
                    )}
                </div>

                <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Email (Contacto)</label>
                    {isEditing ? (
                        <input 
                            type="email"
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-medium text-slate-800 border-b border-slate-100 pb-2">{currentUser.email}</p>
                    )}
                </div>


                <div className="col-span-2 mt-8 pt-6 border-t border-slate-100">
                    <label className="text-sm font-bold text-family-800 uppercase block mb-2 flex items-center gap-2">
                         Seguridad
                    </label>
                    <p className="text-xs text-slate-500 mb-4">Si deseas cambiar tu contraseña, escríbela a continuación. Si la dejas en blanco, tu contraseña actual se mantendrá.</p>

                    {passwordError && (
                      <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                        {passwordError}
                      </div>
                    )}

                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                                    placeholder="Dejar en blanco para no cambiar"
                                    value={newPassword}
                                    onChange={(e) => {
                                      setNewPassword(e.target.value);
                                      setPasswordError('');
                                    }}
                                />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Confirmar Nueva Contraseña</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                                    placeholder="Repite la nueva contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                      setConfirmPassword(e.target.value);
                                      setPasswordError('');
                                    }}
                                />
                             </div>
                        </div>
                    ) : (
                        <div className="bg-family-50 p-4 rounded-lg border border-family-100 text-slate-500 text-sm italic">
                            Pulsa en "Editar Datos" para cambiar tu contraseña.
                        </div>
                    )}
                </div>

                <div className="col-span-2 mt-4 pt-6 border-t border-slate-100">

                    <label className="text-sm font-bold text-family-800 uppercase block mb-2 flex items-center gap-2">
                        <Edit3 size={16} /> Información Personal / Biografía
                    </label>
                    <p className="text-xs text-slate-500 mb-2">Añade información sobre ti, tu profesión, hobbies o familia actual que quieras compartir con el resto de la Family.</p>
                    {isEditing ? (
                        <textarea 
                            rows={6}
                            className="w-full p-3 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none leading-relaxed"
                            placeholder="Escribe aquí tu información personal..."
                            value={formData.personalInfo || ''}
                            onChange={(e) => setFormData({...formData, personalInfo: e.target.value})}
                        />
                    ) : (
                        <div className="bg-family-50 p-4 rounded-lg border border-family-100 min-h-[100px]">
                            {currentUser.personalInfo ? (
                                <p className="text-slate-700 whitespace-pre-wrap">{currentUser.personalInfo}</p>
                            ) : (
                                <p className="text-slate-400 italic">No has añadido información personal aún.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {isEditing && (
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3">
                 <button 
                    onClick={() => {
                        setIsEditing(false);
                        setFormData({...currentUser});
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 flex items-center gap-2 hover:bg-slate-200 rounded transition"
                >
                    <X size={18} /> Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-family-600 text-white rounded hover:bg-family-700 flex items-center gap-2 shadow-sm transition"
                >
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>
        )}
      </div>

      {!isEditing && (
          <div className="flex justify-center mt-12 mb-8">
              <button 
                onClick={handleDeleteAccount}
                className="flex items-center gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 rounded-lg transition border border-transparent hover:border-red-100"
              >
                  <Trash2 size={18} />
                  <span>Darse de baja (Eliminar Cuenta)</span>
              </button>
          </div>
      )}
    </div>
  );
};