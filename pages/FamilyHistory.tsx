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
    <div className="max-w-4xl mx-auto pt-4">
      <div className="flex justify-between items-end mb-8 border-b border-brand-border/50 pb-4">
        <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-1">Historia Familiar</h2>
            <p className="text-sm md:text-base text-brand-accent">Nuestras raíces, leyendas y memorias compartidas.</p>
        </div>
        
        {currentUser?.role === 'admin' && !isEditing && (
            <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 text-brand-accent hover:text-brand-dark font-medium transition-colors"
            >
                <Edit size={20} /> <span className="hidden md:inline">Editar</span>
            </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-brand-border/50 animate-fade-in">
            <div className="mb-8">
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-3">Contenido de texto</h3>
                <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full min-h-[300px] p-5 bg-brand-light/30 border border-brand-border rounded-xl font-serif text-lg leading-relaxed focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-y"
                />
            </div>
            
            <div className="mb-8">
                <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wide mb-3">Galería de Imágenes</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {editImages.map((img, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden shadow-sm border border-brand-border/50">
                            <img src={img} className="w-full h-32 object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-transform hover:scale-110 shadow-lg"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-brand-border rounded-xl text-brand-muted hover:bg-brand-light/50 hover:border-brand-accent hover:text-brand-accent transition-all cursor-pointer"
                    >
                        <ImageIcon size={28} className="mb-2" />
                        <span className="text-xs font-medium uppercase tracking-wider">Añadir Foto</span>
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

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-brand-border/30">
                <button 
                    onClick={() => {
                        setIsEditing(false);
                        setEditContent(history.content);
                        setEditImages(history.images || []);
                    }}
                    className="px-5 py-2.5 text-brand-muted font-bold hover:bg-brand-light rounded-xl transition-colors border border-transparent hover:border-brand-border flex items-center gap-2"
                >
                    <X size={18} /> Cancelar
                </button>
                <button 
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-brand-accent text-white rounded-xl font-bold hover:bg-brand-dark flex items-center gap-2 shadow-md transition-all"
                >
                    <Save size={18} /> Guardar Cambios
                </button>
            </div>
        </div>
      ) : (
        <article className="bg-white p-6 md:p-10 rounded-2xl shadow-card border border-brand-border/40">
            {/* Gallery Display */}
            {history.images && history.images.length > 0 && (
                <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {history.images.map((img, idx) => (
                        <div key={idx} className={`rounded-2xl overflow-hidden shadow-md border border-brand-border/30 bg-brand-light/20 ${history.images && history.images.length === 1 ? 'col-span-full' : ''}`}>
                            <img src={img} alt={`Historia ${idx}`} className="w-full h-64 md:h-96 object-cover hover:scale-105 transition duration-700 ease-out" />
                        </div>
                    ))}
                </div>
            )}

            <div className="prose prose-lg max-w-none font-serif">
                {history.content.split('\n').map((paragraph, idx) => (
                    paragraph ? <p key={idx} className="mb-5 text-brand-text/90 leading-relaxed text-[1.1rem] md:text-lg">{paragraph}</p> : <br key={idx} />
                ))}
            </div>

            <div className="mt-12 pt-6 border-t border-brand-border/30 flex justify-end">
                <p className="text-sm text-brand-muted/70 italic font-serif">
                    Última actualización: {new Date(history.lastUpdated).toLocaleDateString()} por <span className="font-medium text-brand-muted">{history.updatedBy}</span>
                </p>
            </div>
        </article>
      )}
    </div>
  );
};
