import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { FamilyHistory as FamilyHistoryType, HomeSection } from '../types';
import { compressImage, uploadImage } from '../utils/image';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { TableOfContents } from '../components/TableOfContents';
import { Edit, Save, X, Image as ImageIcon, PlusCircle, Trash2, ArrowUp, ArrowDown, ZoomIn } from 'lucide-react';
import Lightbox from '../components/Lightbox';

export const FamilyHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<FamilyHistoryType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeImage, setActiveImage] = useState<{src: string, caption?: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<FamilyHistoryType | null>(null);
  const toc = useTableOfContents(history?.sections, '.toc-target');

  useEffect(() => {
    storage.getHistory().then(data => {
        // Migrate legacy data to sections if needed
        if (!data.sections || data.sections.length === 0) {
          if (data.content || (data.images && data.images.length > 0)) {
            // Convert old content and the first image to a section
            data.sections = [{
              id: 'section-' + Date.now(),
              content: data.content,
              imageUrl: data.images && data.images.length > 0 ? data.images[0] : ''
            }];
            // If there are more images, append them as separate sections
            if (data.images && data.images.length > 1) {
                for (let i = 1; i < data.images.length; i++) {
                    data.sections.push({
                        id: 'section-' + Date.now() + i,
                        content: '',
                        imageUrl: data.images[i]
                    });
                }
            }
            // Clean up old fields visually
            data.content = '';
            data.images = [];
          } else {
            data.sections = [];
          }
        }
        setHistory(data);
        setEditForm(JSON.parse(JSON.stringify(data))); // Deep copy
    }).catch(err => {
        console.error("Error loading history:", err);
        // Fallback para evitar Cargando infinito
        const fallback: FamilyHistoryType = {
            content: "",
            images: [],
            sections: [{
              id: 'section-1',
              content: "Bienvenido a la historia de la familia Mazarrasa. Utilice el botón de edición para añadir la historia familiar."
            }],
            lastUpdated: new Date().toISOString(),
            updatedBy: "Sistema"
        };
        setHistory(fallback);
        setEditForm(JSON.parse(JSON.stringify(fallback)));
    });
  }, []);

  const handleSave = async () => {
    if (!currentUser || !editForm) return;
    setIsSaving(true);
    try {
        const newHistory: FamilyHistoryType = {
            ...editForm,
            lastUpdated: new Date().toISOString(),
            updatedBy: currentUser.firstName
        };
        await storage.saveHistory(newHistory);
        setHistory(newHistory);
        setIsEditing(false);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        alert("Error al guardar: " + msg + ". Si tienes muchas imágenes, intenta reducir su tamaño.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSaving(true);
      try {
        const compressedImage = await compressImage(file);
        const publicUrl = await uploadImage(compressedImage, "history");
        if (!editForm) return;
        setEditForm({
          ...editForm,
          sections: editForm.sections?.map(sec => {
            if (sec.id === sectionId) {
                if (sec.tipo === "imagen") {
                    return { ...sec, src: publicUrl };
                }
                return { ...sec, imageUrl: publicUrl };
            }
            return sec;
          })
        });
      } catch (error) {
        console.error("Error compressing/uploading image", error);
        alert("Error al subir imagen: " + (error instanceof Error ? error.message : String(error)));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const addSection = (tipo: 'texto' | 'imagen' | 'legacy' = 'legacy') => {
    if (!editForm) return;
    const newSection: HomeSection = { id: 'section-' + Date.now() };
    if (tipo === 'texto') {
        newSection.tipo = 'texto';
        newSection.contenido = '';
    } else if (tipo === 'imagen') {
        newSection.tipo = 'imagen';
        newSection.src = '';
        newSection.posicion = 'centro';
    } else {
        newSection.title = '';
        newSection.content = '';
        newSection.imageUrl = '';
    }
    setEditForm({
      ...editForm,
      sections: [...(editForm.sections || []), newSection]
    });
  };

  const moveSectionUp = (index: number) => {
    if (!editForm || index === 0) return;
    const newSections = [...(editForm.sections || [])];
    const temp = newSections[index - 1];
    newSections[index - 1] = newSections[index];
    newSections[index] = temp;
    setEditForm({ ...editForm, sections: newSections });
  };

  const moveSectionDown = (index: number) => {
    if (!editForm || !editForm.sections || index === editForm.sections.length - 1) return;
    const newSections = [...editForm.sections];
    const temp = newSections[index + 1];
    newSections[index + 1] = newSections[index];
    newSections[index] = temp;
    setEditForm({ ...editForm, sections: newSections });
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

  if (!history || !editForm) return <div>Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
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
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-family-200 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800">Editar Historia Familiar</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                    setIsEditing(false);
                    setEditForm(JSON.parse(JSON.stringify(history)));
                }}
                className="p-2 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isSaving ? 'bg-family-400 cursor-not-allowed text-white/80' : 'bg-family-600 hover:bg-family-700 text-white'}`}
              >
                <Save size={18} className={isSaving ? "animate-pulse" : ""} />
                <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
               <h4 className="font-bold text-slate-700 text-lg">Secciones Dinámicas</h4>
               <div className="flex gap-2">
                 <button onClick={() => addSection('texto')} className="flex items-center gap-1 text-sm bg-family-50 border border-family-200 text-family-700 px-3 py-1.5 rounded-lg hover:bg-family-100 transition shadow-sm">
                    <PlusCircle size={14} /> Texto
                 </button>
                 <button onClick={() => addSection('imagen')} className="flex items-center gap-1 text-sm bg-family-50 border border-family-200 text-family-700 px-3 py-1.5 rounded-lg hover:bg-family-100 transition shadow-sm">
                    <ImageIcon size={14} /> Imagen
                 </button>
                 <button onClick={() => addSection('legacy')} className="flex items-center gap-1 text-sm bg-family-100 border border-family-300 text-family-800 px-3 py-1.5 rounded-lg hover:bg-family-200 transition shadow-sm" title="Bloque antiguo (Título + Texto + Imagen lateral)">
                    <PlusCircle size={14} /> Bloque Clásico
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
                  <div className="absolute top-4 right-14 flex gap-1">
                    <button onClick={() => moveSectionUp(index)} className="text-slate-400 hover:text-family-600 bg-slate-50 p-2 rounded-full transition" title="Mover Arriba"><ArrowUp size={16}/></button>
                    <button onClick={() => moveSectionDown(index)} className="text-slate-400 hover:text-family-600 bg-slate-50 p-2 rounded-full transition" title="Mover Abajo"><ArrowDown size={16}/></button>
                  </div>
                  <h5 className="text-xs font-bold text-slate-400 uppercase mb-4">
                    Bloque {index + 1} <span className="text-family-500 bg-family-50 px-2 py-0.5 rounded-full ml-2 text-[10px]">{section.tipo || 'Clásico'}</span>
                  </h5>

                  <div className="space-y-4">
                    {section.tipo === 'texto' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Contenido / Escrito</label>
                          <textarea
                            className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-family-500 outline-none min-h-[120px]"
                            value={section.contenido || ''}
                            onChange={e => updateSection(section.id, 'contenido', e.target.value)}
                            placeholder="Escribe aquí el texto que desees mostrar..."
                          />
                        </div>
                    )}
                    {section.tipo === 'imagen' && (
                        <div className="space-y-4 border border-slate-100 bg-slate-50 p-4 rounded-lg">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Imagen</label>
                            <div className="mt-2 flex items-center gap-4">
                                {section.src && (
                                <img src={section.src} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-slate-200" />
                                )}
                                <label className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-family-400 hover:bg-family-100 transition bg-white">
                                <ImageIcon className="text-slate-400" size={24} />
                                <span className="text-[10px] text-slate-500 mt-1">Subir Imagen</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, section.id)} />
                                </label>
                                {section.src && (
                                <button
                                    onClick={() => updateSection(section.id, 'src', '')}
                                    className="text-xs text-red-500 hover:underline"
                                >
                                    Eliminar imagen
                                </button>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">* Para mejor rendimiento web, se recomienda subir imágenes en formato WebP.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Pie de foto (Opcional)</label>
                                <input
                                    className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-family-500 outline-none"
                                    value={section.caption || ''}
                                    onChange={e => updateSection(section.id, 'caption', e.target.value)}
                                    placeholder="Ej: El abuelo en 1950"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Alineación</label>
                                <select
                                    className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-family-500 outline-none bg-white"
                                    value={section.posicion || 'centro'}
                                    onChange={e => updateSection(section.id, 'posicion', e.target.value)}
                                >
                                    <option value="izquierda">Izquierda (Texto rodea por derecha)</option>
                                    <option value="derecha">Derecha (Texto rodea por izquierda)</option>
                                    <option value="centro">Centro (Estándar)</option>
                                    <option value="ancho_completo">Ancho Completo (Imagen grande)</option>
                                </select>
                              </div>
                          </div>
                        </div>
                    )}
                    {!section.tipo && (
                    <>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Título de la sección (Opcional)</label>
                      <input
                        className="w-full p-2 border border-slate-200 rounded focus:ring-2 focus:ring-family-500 outline-none font-serif text-lg"
                        value={section.title || ''}
                        onChange={e => updateSection(section.id, 'title', e.target.value)}
                        placeholder="Ej: Los Orígenes"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Contenido / Escrito</label>
                      <textarea
                        className="w-full p-3 border border-slate-200 rounded focus:ring-2 focus:ring-family-500 outline-none min-h-[120px]"
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
                        <label className="flex flex-col items-center justify-center w-32 h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-family-400 hover:bg-family-50 transition">
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
                    </>
                    )}
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
        <article className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-family-100">
            <TableOfContents toc={toc} className="mb-16 max-w-2xl" />

            <div className="space-y-8 editorial-content clearfix relative">
                <Lightbox
                  isOpen={!!activeImage}
                  src={activeImage?.src || ''}
                  caption={activeImage?.caption}
                  onClose={() => setActiveImage(null)}
                />

                {history.sections?.map((section, idx) => (
                    <div key={section.id} className="animate-fade-in clearfix mb-8">
                        {!section.tipo && (
                            <div className="space-y-6 clear-both">
                                {section.title && (
                                    <h3 className="toc-target text-3xl font-serif font-bold text-slate-800 text-center border-b border-slate-200 pb-4 mb-8">
                                        {section.title}
                                    </h3>
                                )}

                                <div className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-8 items-center`}>
                                    {section.imageUrl && (
                                        <div className={`w-full ${section.content ? 'md:w-1/2' : ''}`}>
                                            <div
                                              className="rounded-2xl overflow-hidden shadow-xl border-4 border-white cursor-zoom-in group relative bg-slate-100 aspect-video flex items-center justify-center"
                                              onClick={() => setActiveImage({ src: section.imageUrl as string, caption: section.title })}
                                            >
                                                <img src={section.imageUrl} alt={section.title || "Historia Familiar"} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <ZoomIn className="text-white drop-shadow-md" size={32} />
                                                </div>
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
                                {idx < (history.sections?.length || 0) - 1 && !history.sections[idx+1].tipo && (
                                    <div className="w-24 h-px bg-slate-300 mx-auto mt-16"></div>
                                )}
                            </div>
                        )}

                        {section.tipo === 'texto' && (
                            <div className="prose prose-lg prose-stone max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-serif text-justify">
                                {section.contenido}
                            </div>
                        )}

                        {section.tipo === 'imagen' && section.src && (
                            <figure
                                className={`
                                    cursor-zoom-in group relative rounded-lg overflow-hidden shadow-lg border border-slate-100 bg-slate-50
                                    ${section.posicion === 'izquierda' ? 'float-left mr-8 mb-4 w-full md:w-1/2 lg:w-1/3' : ''}
                                    ${section.posicion === 'derecha' ? 'float-right ml-8 mb-4 w-full md:w-1/2 lg:w-1/3' : ''}
                                    ${section.posicion === 'ancho_completo' ? 'w-full clear-both my-12' : ''}
                                    ${(!section.posicion || section.posicion === 'centro') ? 'w-full md:w-3/4 mx-auto clear-both my-8' : ''}
                                `}
                                onClick={() => setActiveImage({ src: section.src as string, caption: section.caption })}
                            >
                                <div className="relative aspect-video flex items-center justify-center bg-slate-100">
                                    <img
                                        src={section.src}
                                        alt={section.caption || "Imagen de la historia"}
                                        loading="lazy"
                                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105`}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                                        <ZoomIn className="text-white drop-shadow-md" size={32} />
                                    </div>
                                </div>
                                {section.caption && (
                                    <figcaption className="text-center p-3 bg-white text-sm text-slate-500 font-serif italic border-t border-slate-100 relative z-20">
                                        {section.caption}
                                    </figcaption>
                                )}
                            </figure>
                        )}
                    </div>
                ))}

                {(!history.sections || history.sections.length === 0) && (
                    <div className="min-h-[200px] flex items-center justify-center text-slate-400 italic font-serif">
                        <p>Aún no hay historia familiar escrita.</p>
                    </div>
                )}
            </div>

            <div className="mt-12 pt-6 border-t border-slate-100 text-xs text-slate-400 italic text-right">
                Última actualización: {new Date(history.lastUpdated).toLocaleDateString()} por {history.updatedBy}
            </div>
        </article>
      )}
    </div>
  );
};
