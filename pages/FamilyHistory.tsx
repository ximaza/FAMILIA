import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { FamilyHistory as FamilyHistoryType } from '../types';
import { Edit, Save, X, Image as ImageIcon, Trash2 } from 'lucide-react';

export const FamilyHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<FamilyHistoryType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editImages, setEditImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    storage.getHistory().then(data => {
      setHistory(data);
      setEditContent(data.content);
      setEditImages(data.images || []);
    });
  }, []);

  const handleSave = async () => {
    if (!currentUser) return;
    const newHistory: FamilyHistoryType = {
        content: editContent,
        images: editImages,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser.firstName
    };
    await storage.saveHistory(newHistory);
    setHistory(newHistory);
    setIsEditing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 800 * 1024) {
              alert("La imagen es demasiado grande. Máximo 800KB.");
              return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditImages([...editImages, reader.result as string]);
          };
          reader.readAsDataURL(file);
      }
  };

  const removeImage = (index: number) => {
      const newImages = [...editImages];
      newImages.splice(index, 1);
      setEditImages(newImages);
  };

  if (!history) return <div>Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-family-200 pb-4">
        <div>
            <h2 className="text-4xl font-serif font-bold text-family-900">Historia Familiar</h2>
            <p className="text-family-600 mt-2">Nuestras raíces, leyendas y memorias compartidas.</p>
        </div>
        
        {currentUser?.role === 'admin' && !isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-family-600 hover:text-family-800 font-medium"
            >
                <Edit size={18} /> Editar
            </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-2">Contenido de texto</h3>
                <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[300px] p-4 border border-slate-300 rounded-lg font-serif text-lg leading-relaxed focus:ring-2 focus:ring-family-400 outline-none"
                />
            </div>
            
            <div className="mb-6">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-2">Galería de Imágenes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {editImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                            <img src={img} className="w-full h-32 object-cover rounded-lg border border-slate-200" />
                            <button 
                                onClick={() => removeImage(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:bg-slate-50 hover:border-family-400 hover:text-family-500 transition cursor-pointer"
                    >
                        <ImageIcon size={24} />
                        <span className="text-xs mt-2">Añadir Foto</span>
                    </button>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                <button 
                    onClick={() => {
                        setIsEditing(false);
                        setEditContent(history.content);
                        setEditImages(history.images || []);
                    }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 flex items-center gap-2"
                >
                    <X size={18} /> Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-family-600 text-white rounded-lg hover:bg-family-700 flex items-center gap-2"
                >
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>
        </div>
      ) : (
        <article className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-family-100">
            {/* Gallery Display */}
            {history.images && history.images.length > 0 && (
                <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {history.images.map((img, idx) => (
                        <div key={idx} className={`rounded-lg overflow-hidden shadow-md ${history.images && history.images.length === 1 ? 'col-span-2' : ''}`}>
                            <img src={img} alt={`Historia ${idx}`} className="w-full h-64 md:h-80 object-cover hover:scale-105 transition duration-500" />
                        </div>
                    ))}
                </div>
            )}

            <div className="prose prose-lg prose-stone max-w-none font-serif">
                {history.content.split('\n').map((paragraph, idx) => (
                    paragraph ? <p key={idx} className="mb-4 text-slate-700 leading-relaxed">{paragraph}</p> : <br key={idx} />
                ))}
            </div>
            <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 italic text-right">
                Última actualización: {new Date(history.lastUpdated).toLocaleDateString()} por {history.updatedBy}
            </div>
        </article>
      )}
    </div>
  );
};