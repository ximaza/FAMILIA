import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { FamilyHistory as FamilyHistoryType, HomeSection } from '../types';
import { useTableOfContents } from '../hooks/useTableOfContents';
import { TableOfContents } from '../components/TableOfContents';
import { Edit, Save, X, Image as ImageIcon, PlusCircle, Trash2 } from 'lucide-react';

export const FamilyHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const [history, setHistory] = useState<FamilyHistoryType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<FamilyHistoryType | null>(null);
  const toc = useTableOfContents(history, '.toc-target');

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
    const newHistory: FamilyHistoryType = {
        ...editForm,
        lastUpdated: new Date().toISOString(),
        updatedBy: currentUser.firstName
    };
    await storage.saveHistory(newHistory);
    setHistory(newHistory);
    setIsEditing(false);
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
                className="flex items-center gap-2 bg-family-600 text-white px-4 py-2 rounded-lg hover:bg-family-700 transition shadow-md"
              >
                <Save size={18} />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
               <h4 className="font-bold text-slate-700 text-lg">Secciones Dinámicas</h4>
               <button onClick={addSection} className="flex items-center gap-1 text-sm bg-family-100 text-family-700 px-3 py-1.5 rounded-lg hover:bg-family-200 transition">
                  <PlusCircle size={16} /> Añadir Sección
               </button>
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

            <div className="space-y-16">
                {history.sections?.map((section, idx) => (
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
                                        <img src={section.imageUrl} alt={section.title || "Historia Familiar"} className="w-full h-auto object-cover" />
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
                        {idx < (history.sections?.length || 0) - 1 && (
                            <div className="w-24 h-px bg-slate-300 mx-auto mt-16"></div>
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
