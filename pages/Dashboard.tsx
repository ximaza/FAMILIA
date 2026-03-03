import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Edit2, Save, X, Image as ImageIcon } from 'lucide-react';
import { HomePageContent } from '../types';

export const Dashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState<HomePageContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<HomePageContent>({} as HomePageContent);

  useEffect(() => {
    storage.getHomePage().then(data => {
      setContent(data);
      setEditForm(data);
    });
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const handleSave = async () => {
    const updatedContent = {
      ...editForm,
      lastUpdated: new Date().toISOString()
    };
    await storage.saveHomePage(updatedContent);
    setContent(updatedContent);
    setIsEditing(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!content) return <div>Cargando...</div>;

  return (
    <div className="space-y-6 relative pt-4">
      {isAdmin && !isEditing && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-2 right-2 p-2.5 bg-brand-light text-brand-dark rounded-full hover:bg-brand-accent hover:text-white transition-colors shadow-md border border-brand-border/50"
          title="Editar página de inicio"
        >
          <Edit2 size={20} />
        </button>
      )}

      {isEditing ? (
        <div className="bg-white p-8 rounded-2xl shadow-card border border-brand-border/50 space-y-6">
          <div className="flex justify-between items-center border-b border-brand-border/30 pb-4">
            <h3 className="text-xl font-bold text-brand-text">Editar Página de Inicio</h3>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 text-brand-muted hover:text-brand-text transition-colors"
              >
                <X size={24} />
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-brand-accent text-white px-5 py-2.5 rounded-xl font-medium hover:bg-brand-dark transition-colors shadow-md"
              >
                <Save size={18} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wide mb-2">Mensaje de Bienvenida</label>
              <input 
                className="w-full p-3 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                value={editForm.welcomeMessage}
                onChange={e => setEditForm({...editForm, welcomeMessage: e.target.value})}
                placeholder="Ej: Bienvenido/a"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wide mb-2">Título Principal</label>
              <input 
                className="w-full p-3 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none font-serif transition-all"
                value={editForm.mainTitle}
                onChange={e => setEditForm({...editForm, mainTitle: e.target.value})}
                placeholder="Ej: AL ENCUENTRO DE LOS MAZARRASA"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wide mb-2">Contenido de la Página (Opcional)</label>
              <textarea 
                className="w-full p-3 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none min-h-[150px] transition-all"
                value={editForm.bodyContent}
                onChange={e => setEditForm({...editForm, bodyContent: e.target.value})}
                placeholder="Escribe aquí el texto que desees mostrar..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-muted uppercase tracking-wide mb-2">Imagen Destacada (Opcional)</label>
              <div className="mt-2 flex items-center gap-4">
                {editForm.imageUrl && (
                  <img src={editForm.imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded-xl border border-brand-border shadow-sm" />
                )}
                <label className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed border-brand-border rounded-xl cursor-pointer hover:border-brand-accent hover:bg-brand-light/50 transition-colors">
                  <ImageIcon className="text-brand-muted" size={24} />
                  <span className="text-[10px] text-brand-muted font-medium mt-1">Subir Imagen</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
                {editForm.imageUrl && (
                  <button 
                    onClick={() => setEditForm({...editForm, imageUrl: undefined})}
                    className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                  >
                    Eliminar imagen
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className="mb-10 text-center py-10 px-4">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-brand-text tracking-tight mb-4 leading-tight">
              {content.welcomeMessage}, <br className="md:hidden" />
              <span className="text-brand-dark">{currentUser?.firstName}</span>
            </h2>
            <h2 className="text-2xl md:text-4xl font-serif font-medium text-brand-muted tracking-wide mt-4">
              {content.mainTitle}
            </h2>
          </header>

          <div className="max-w-3xl mx-auto space-y-10 px-2">
            {content.imageUrl && (
              <div className="rounded-3xl overflow-hidden shadow-card border border-brand-border/50 bg-white">
                <img src={content.imageUrl} alt="Familia Mazarrasa" className="w-full h-auto object-cover" />
              </div>
            )}
            
            {content.bodyContent && (
              <div className="prose prose-lg max-w-none text-brand-text/80 leading-relaxed text-center whitespace-pre-wrap font-serif px-6 bg-white/50 py-8 rounded-3xl border border-brand-border/30">
                {content.bodyContent}
              </div>
            )}

            {!content.imageUrl && !content.bodyContent && (
              <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-brand-border rounded-3xl opacity-50">
                <p className="text-brand-muted font-medium">Contenido en construcción</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
