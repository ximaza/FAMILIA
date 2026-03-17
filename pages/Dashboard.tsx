import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Edit2, Save, X, Image as ImageIcon } from 'lucide-react';
import { HomePageContent } from '../types';

export const Dashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState<HomePageContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<HomePageContent | null>(null);

  useEffect(() => {
    storage.getHomePage().then(data => {
      setContent(data);
      setEditForm(data);
    }).catch(err => {
      console.error("Error loading homepage:", err);
      // Fallback para evitar Cargando infinito
      const fallback = {
        welcomeMessage: "Bienvenido/a",
        mainTitle: "AL ENCUENTRO DE LOS MAZARRASA",
        bodyContent: "Espacio reservado para compartir noticias y novedades.",
        imageUrl: "",
        lastUpdated: new Date().toISOString()
      };
      setContent(fallback);
      setEditForm(fallback);
    });
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const handleSave = async () => {
    if (!editForm) return;
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

  if (!content || !editForm) return <div className="text-center py-12">Cargando...</div>;

  return (
    <div className="space-y-6 relative">
      {isAdmin && !isEditing && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-0 right-0 p-2 bg-turquoise-100 text-turquoise-700 rounded-full hover:bg-turquoise-200 transition shadow-sm"
          title="Editar página de inicio"
        >
          <Edit2 size={20} />
        </button>
      )}

      {isEditing ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-turquoise-200 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800">Editar Página de Inicio</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
              <button 
                onClick={handleSave}
                className="flex items-center gap-2 bg-turquoise-600 text-white px-4 py-2 rounded-lg hover:bg-turquoise-700 transition shadow-md"
              >
                <Save size={18} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensaje de Bienvenida</label>
              <input 
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-turquoise-500 outline-none"
                value={editForm.welcomeMessage}
                onChange={e => setEditForm({...editForm, welcomeMessage: e.target.value})}
                placeholder="Ej: Bienvenido/a"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título Principal</label>
              <input 
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-turquoise-500 outline-none font-serif"
                value={editForm.mainTitle}
                onChange={e => setEditForm({...editForm, mainTitle: e.target.value})}
                placeholder="Ej: AL ENCUENTRO DE LOS MAZARRASA"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contenido de la Página (Opcional)</label>
              <textarea 
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-turquoise-500 outline-none min-h-[150px]"
                value={editForm.bodyContent}
                onChange={e => setEditForm({...editForm, bodyContent: e.target.value})}
                placeholder="Escribe aquí el texto que desees mostrar..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Imagen Destacada (Opcional)</label>
              <div className="mt-2 flex items-center gap-4">
                {editForm.imageUrl && (
                  <img src={editForm.imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-slate-200" />
                )}
                <label className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-turquoise-400 hover:bg-turquoise-50 transition">
                  <ImageIcon className="text-slate-400" size={24} />
                  <span className="text-[10px] text-slate-500 mt-1">Subir Imagen</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
                {editForm.imageUrl && (
                  <button 
                    onClick={() => setEditForm({...editForm, imageUrl: undefined})}
                    className="text-xs text-red-500 hover:underline"
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
          <header className="mb-8 text-center py-12">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-black tracking-tight mb-4">
              {content.welcomeMessage}, {currentUser?.firstName}
            </h2>
            <h2 className="text-4xl md:text-5xl font-serif font-black text-turquoise-700 tracking-tight">
              {content.mainTitle}
            </h2>
          </header>

          <div className="max-w-3xl mx-auto space-y-8">
            {content.imageUrl && (
              <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                <img src={content.imageUrl} alt="Familia Mazarrasa" className="w-full h-auto" />
              </div>
            )}
            
            {content.bodyContent && (
              <div className="prose prose-lg max-w-none text-slate-700 leading-relaxed text-center whitespace-pre-wrap font-serif italic">
                {content.bodyContent}
              </div>
            )}

            {!content.imageUrl && !content.bodyContent && (
              <div className="min-h-[200px] flex items-center justify-center">
                {/* Espacio reservado para futura imagen o texto */}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};