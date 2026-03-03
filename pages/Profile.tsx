import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { User } from '../types';
import { Save, X, Edit3, UserCircle, Trash2, Camera, Upload } from 'lucide-react';

export const Profile: React.FC = () => {
  const { currentUser, refreshUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
        setFormData({ ...currentUser });
    }
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser || !formData.id) return;
    
    const updatedUser: User = {
        ...currentUser,
        firstName: formData.firstName || currentUser.firstName,
        surnames: (formData.surnames || currentUser.surnames) as [string, string, string, string],
        birthDate: formData.birthDate || currentUser.birthDate,
        parentsNames: formData.parentsNames || currentUser.parentsNames,
        email: formData.email || currentUser.email,
        personalInfo: formData.personalInfo || '',
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Size limit check (e.g., 800KB) to prevent localStorage quota exceeded
      if (file.size > 800 * 1024) {
        alert("La imagen es demasiado grande. Por favor sube una imagen menor de 800KB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
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
    <div className="max-w-3xl mx-auto pt-4">
      <div className="flex justify-between items-center mb-8 border-b border-brand-border/50 pb-4">
        <div className="flex items-center gap-4">
            <h2 className="text-3xl font-serif font-bold text-brand-dark">Mi Perfil</h2>
        </div>
        {!isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-brand-accent text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark transition-colors shadow-md font-medium"
            >
                <Edit3 size={18} /> <span className="hidden md:inline">Editar Datos</span>
            </button>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-card border border-brand-border/40 overflow-hidden mb-8">
        
        {/* Header / Banner area with Photo */}
        <div className="bg-brand-light/40 p-10 border-b border-brand-border/50 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="relative group">
                <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-brand-border shadow-md bg-white flex items-center justify-center p-1.5">
                    {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Perfil" className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <UserCircle size={120} className="text-brand-muted/30" />
                    )}
                </div>
                
                {isEditing && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 bg-brand-accent text-white p-2.5 rounded-full hover:bg-brand-dark shadow-lg transition-transform hover:scale-110 border-2 border-white"
                        title="Cambiar foto"
                    >
                        <Camera size={20} />
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
            
            <div className="flex-1">
                <h3 className="text-3xl font-serif font-bold text-brand-dark tracking-wide">{formData.firstName} {formData.surnames?.[0]}</h3>
                <p className="text-brand-muted mt-1 text-lg">{formData.email}</p>
                {isEditing && <p className="text-xs font-medium text-brand-accent mt-3">* Haz clic en la cámara para subir foto (Max 800KB)</p>}
            </div>
        </div>

        <div className="p-8 md:p-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-2">Nombre</label>
                    {isEditing ? (
                        <input 
                            className="w-full p-3 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-bold text-brand-text border-b border-brand-border/30 pb-2">{currentUser.firstName}</p>
                    )}
                </div>

                <div className="col-span-2 md:col-span-1">
                    <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-2">Fecha de Nacimiento</label>
                    {isEditing ? (
                        <input 
                            type="date"
                            className="w-full p-3 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-bold text-brand-text border-b border-brand-border/30 pb-2">{new Date(currentUser.birthDate).toLocaleDateString()}</p>
                    )}
                </div>

                <div className="col-span-2">
                    <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-3">Apellidos</label>
                    {isEditing ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[0, 1, 2, 3].map(idx => (
                                <input 
                                    key={idx}
                                    className="w-full p-3 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all text-sm"
                                    placeholder={`${idx + 1}º Apellido`}
                                    value={formData.surnames?.[idx]}
                                    onChange={(e) => handleChangeSurname(idx, e.target.value)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {currentUser.surnames.map((s, i) => s && (
                                <span key={i} className="bg-brand-light/50 border border-brand-border px-4 py-1.5 rounded-full text-brand-text font-bold text-sm shadow-sm">
                                    {s}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="col-span-2">
                    <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-2">Nombre de los Padres</label>
                    {isEditing ? (
                        <input 
                            className="w-full p-3 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                            value={formData.parentsNames}
                            onChange={(e) => setFormData({...formData, parentsNames: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-bold text-brand-text border-b border-brand-border/30 pb-2">{currentUser.parentsNames}</p>
                    )}
                </div>

                <div className="col-span-2">
                    <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-2">Email (Contacto)</label>
                    {isEditing ? (
                        <input 
                            type="email"
                            className="w-full p-3 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    ) : (
                        <p className="text-lg font-bold text-brand-text border-b border-brand-border/30 pb-2">{currentUser.email}</p>
                    )}
                </div>

                <div className="col-span-2 mt-6">
                    <label className="text-sm font-bold text-brand-dark uppercase tracking-wider block mb-3 flex items-center gap-2">
                        <Edit3 size={18} className="text-brand-accent" /> Información Personal / Biografía
                    </label>
                    {isEditing ? (
                        <>
                            <p className="text-xs font-medium text-brand-muted mb-3 leading-relaxed">Añade información sobre ti, tu profesión, hobbies o familia actual que quieras compartir con el resto de la Family.</p>
                            <textarea
                                rows={6}
                                className="w-full p-4 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none leading-relaxed transition-all resize-y"
                                placeholder="Escribe aquí tu información personal..."
                                value={formData.personalInfo || ''}
                                onChange={(e) => setFormData({...formData, personalInfo: e.target.value})}
                            />
                        </>
                    ) : (
                        <div className="bg-brand-light/30 p-6 rounded-2xl border border-brand-border/50 min-h-[120px]">
                            {currentUser.personalInfo ? (
                                <p className="text-brand-text/90 leading-relaxed whitespace-pre-wrap">{currentUser.personalInfo}</p>
                            ) : (
                                <p className="text-brand-muted/60 italic font-medium">No has añadido información personal aún.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {isEditing && (
            <div className="bg-brand-light/20 p-8 border-t border-brand-border/50 flex justify-end gap-4">
                 <button 
                    onClick={() => {
                        setIsEditing(false);
                        setFormData({...currentUser});
                    }}
                    className="px-5 py-2.5 text-brand-muted font-bold hover:bg-brand-light rounded-xl transition-colors border border-transparent hover:border-brand-border flex items-center gap-2"
                >
                    <X size={18} /> Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-brand-accent text-white rounded-xl hover:bg-brand-dark font-bold flex items-center gap-2 shadow-md transition-colors"
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
                className="flex items-center gap-2 text-red-500 hover:text-red-700 font-medium px-4 py-2 rounded-xl transition-colors hover:bg-red-50"
              >
                  <Trash2 size={18} />
                  <span>Darse de baja (Eliminar Cuenta)</span>
              </button>
          </div>
      )}
    </div>
  );
};
