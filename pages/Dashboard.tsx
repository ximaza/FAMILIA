import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Edit2, Save, X, Image as ImageIcon, PlusCircle, Trash2 } from 'lucide-react';
import { HomePageContent, HomeSection } from '../types';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { TableOfContents } from '../components/TableOfContents';
import { compressImage, uploadImage } from '../utils/image';

export const Dashboard: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [content, setContent] = useState<HomePageContent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<HomePageContent | null>(null);
  const toc = useTableOfContents(content?.sections, '.toc-target');

  useEffect(() => {
    storage.getHomePage().then(data => {
      // Migrate legacy data to sections if needed
      if (!data.sections || data.sections.length === 0) {
        if (data.bodyContent || data.imageUrl) {
          data.sections = [{
            id: 'section-' + Date.now(),
            content: data.bodyContent,
            imageUrl: data.imageUrl
          }];
          // Clean up old fields visually
          data.bodyContent = '';
          data.imageUrl = '';
        } else {
          data.sections = [];
        }
      }
      setContent(data);
      setEditForm(JSON.parse(JSON.stringify(data))); // Deep copy
    }).catch(err => {
      console.error("Error loading homepage:", err);
      // Fallback para evitar Cargando infinito
      const fallback: HomePageContent = {
        welcomeMessage: "Bienvenido/a",
        mainTitle: "AL ENCUENTRO DE LOS MAZARRASA",
        bodyContent: "",
        imageUrl: "",
        sections: [],
        lastUpdated: new Date().toISOString()
      };
      setContent(fallback);
      setEditForm(JSON.parse(JSON.stringify(fallback)));
    });
  }, []);

  const isAdmin = currentUser?.role === 'admin';

  const handleSave = async () => {
    if (!editForm) return;
    setIsSaving(true);
    try {
        const updatedContent = {
          ...editForm,
          lastUpdated: new Date().toISOString()
        };
        await storage.saveHomePage(updatedContent);
        setContent(updatedContent);
        setIsEditing(false);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        alert("Error al guardar: " + msg + ". Si tienes muchas imágenes, intenta reducir su tamaño.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
          alert("La imagen es demasiado grande. Máximo 800KB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (!editForm) return;
        setEditForm({
          ...editForm,
          sections: editForm.sections?.map(sec =>
            sec.id === sectionId ? { ...sec, imageUrl: reader.result as string } : sec
          )
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addSection = () => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      sections: [...(editForm.sections || []), { id: 'section-' + Date.now(), title: '', content: '', imageUrl: '' }]
    });
  };

  const removeSection = (sectionId: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      sections: editForm.sections?.filter(sec => sec.id !== sectionId)
    });
  };

  const updateSection = (sectionId: string, field: keyof HomeSection, value: string) => {
    if (!editForm) return;
    setEditForm({
      ...editForm,
      sections: editForm.sections?.map(sec =>
        sec.id === sectionId ? { ...sec, [field]: value } : sec
      )
    });
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
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isSaving ? 'bg-turquoise-400 cursor-not-allowed text-white/80' : 'bg-turquoise-600 hover:bg-turquoise-700 text-white'}`}
              >
                <Save size={18} className={isSaving ? "animate-pulse" : ""} />
                <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-4 bg-slate-50 p-6 rounded-lg border border-slate-200">
            <h4 className="font-bold text-slate-700 border-b border-slate-200 pb-2 mb-4">Cabecera Principal</h4>
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
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
               <h4 className="font-bold text-slate-700 text-lg">Secciones Dinámicas</h4>
               <div className="flex items-center gap-4">
                 {isUploadingImage && <span className="text-sm text-turquoise-600 animate-pulse italic">Subiendo imagen...</span>}
                 <button onClick={addSection} className="flex items-center gap-1 text-sm bg-turquoise-100 text-turquoise-700 px-3 py-1.5 rounded-lg hover:bg-turquoise-200 transition">
                  <PlusCircle size={16} /> Añadir Sección
                 </button>
               </div>
            </div>

            {editForm.sections?.map((section, index) => (
               <div key={section.id} className="relative bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
                  <button 
                    onClick={() => removeSection(section.id)}
                    className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-full transition"
                    title="Eliminar esta sección"
                  >
                    <Trash2 size={16} />
                  </button>
                  <h5 className="text-xs font-bold text-slate-400 uppercase mb-4">Sección {index + 1}</h5>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Título de la sección (Opcional)</label>
                      <input
                        className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-turquoise-500 outline-none font-serif text-lg"
                        value={section.title || ''}
                        onChange={e => updateSection(section.id, 'title', e.target.value)}
                        placeholder="Ej: Reunión Anual 2024"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Contenido / Escrito</label>
                      <textarea
                        className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-turquoise-500 outline-none min-h-[120px]"
                        value={section.content || ''}
                        onChange={e => updateSection(section.id, 'content', e.target.value)}
                        placeholder="Escribe aquí el texto que desees mostrar..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Imagen (Opcional)</label>
                      <div className="mt-2 flex items-center gap-4">
                        {section.imageUrl && (
                          <img src={section.imageUrl} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-slate-200" />
                        )}
                        <label className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-turquoise-400 hover:bg-turquoise-50 transition">
                          <ImageIcon className="text-slate-400" size={24} />
                          <span className="text-[10px] text-slate-500 mt-1">Subir Imagen</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, section.id)} />
                        </label>
                        {section.imageUrl && (
                          <button
                            onClick={() => updateSection(section.id, 'imageUrl', '')}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Eliminar imagen
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
               </div>
            ))}
            {(!editForm.sections || editForm.sections.length === 0) && (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-slate-500">
                    No hay secciones creadas. Haz clic en "Añadir Sección" para comenzar.
                </div>
            )}
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

          <TableOfContents toc={toc} />

          <div className="max-w-4xl mx-auto space-y-16">
            {content.sections?.map((section, idx) => (
                <div key={section.id} className="space-y-6 animate-fade-in">
                    {section.title && (
                        <h3 className="toc-target text-3xl font-serif font-bold text-slate-800 text-center border-b border-slate-200 pb-4 mb-8">
                            {section.title}
                        </h3>
                    )}

                    {/* Disposición en dos columnas o una sola columna si no hay imagen/texto */}
                    <div className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
                        {section.imageUrl && (
                            <div className={`w-full ${section.content ? 'md:w-1/2' : ''}`}>
                                <div className="rounded-2xl overflow-hidden shadow-xl border-4 border-white">
                                    <img src={section.imageUrl} alt={section.title || "Familia Mazarrasa"} className="w-full h-auto object-cover" />
                                </div>
                            </div>
                        )}

                        {section.content && (
                            <div className={`w-full ${section.imageUrl ? 'md:w-1/2' : ''} prose prose-lg prose-stone max-w-none`}>
                                <div className="text-slate-700 leading-relaxed whitespace-pre-wrap font-serif text-justify">
                                    {section.content}
                                </div>
                            </div>
                        )}
                    </div>
                    {idx < (content.sections?.length || 0) - 1 && (
                        <div className="w-24 h-px bg-slate-300 mx-auto mt-16"></div>
                    )}
                </div>
            ))}

            {(!content.sections || content.sections.length === 0) && (
              <div className="min-h-[200px] flex items-center justify-center text-slate-400 italic font-serif">
                 <p>Espacio reservado para novedades y escritos de la familia.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
