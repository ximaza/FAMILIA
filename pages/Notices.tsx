import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Notice } from '../types';
import { Plus, Tag, Wand2, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { draftNoticeContent } from '../services/geminiService';

export const Notices: React.FC = () => {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Notice['type']>('general');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isDrafting, setIsDrafting] = useState(false);

  useEffect(() => {
    storage.getNotices().then(setNotices);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const newNotice: Notice = {
      id: Date.now().toString(),
      authorId: currentUser.id,
      authorName: `${currentUser.firstName} ${currentUser.surnames[0]}`,
      title,
      content,
      type,
      imageUrl: imageUrl,
      date: new Date().toISOString()
    };

    await storage.addNotice(newNotice);
    const updatedNotices = await storage.getNotices();
    setNotices(updatedNotices);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setType('general');
    setImageUrl('');
    setShowForm(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) {
        alert("Imagen demasiado grande. Máximo 800KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAIDraft = async () => {
    if (!title) {
      alert("Por favor escribe un título o tema primero para ayudar al asistente.");
      return;
    }
    setIsDrafting(true);
    const draft = await draftNoticeContent(title, type);
    setContent(draft);
    setIsDrafting(false);
  };

  const getBadgeColor = (t: string) => {
    switch(t) {
      case 'offer': return 'bg-emerald-100 text-emerald-800';
      case 'event': return 'bg-purple-100 text-purple-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getTypeLabel = (t: string) => {
    switch(t) {
        case 'offer': return 'Oferta';
        case 'event': return 'Evento';
        default: return 'General';
      }
  };

  return (
    <div className="max-w-4xl mx-auto pt-4">
      <div className="flex justify-between items-center mb-8 border-b border-brand-border/50 pb-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark">Comunicaciones</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-brand-accent text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-brand-dark transition-colors shadow-md font-bold"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span className="hidden md:inline">{showForm ? 'Cancelar' : 'Nueva Comunicación'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-brand-border/40 mb-10 animate-fade-in">
          <h3 className="text-xl font-bold mb-6 text-brand-text">Publicar nueva comunicación</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-brand-muted/70 uppercase tracking-wider mb-2">Título / Tema</label>
                    <input 
                        required
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3.5 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all"
                        placeholder="Ej: Cena de Navidad, Vendo coche..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-brand-muted/70 uppercase tracking-wider mb-2">Tipo</label>
                    <select 
                        value={type}
                        onChange={(e) => setType(e.target.value as Notice['type'])}
                        className="w-full p-3.5 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all cursor-pointer"
                    >
                        <option value="general">General</option>
                        <option value="event">Evento / Reunión</option>
                        <option value="offer">Oferta / Oportunidad</option>
                    </select>
                </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-brand-muted/70 uppercase tracking-wider">Contenido</label>
                <button 
                    type="button"
                    onClick={handleAIDraft}
                    disabled={isDrafting}
                    className="text-xs flex items-center gap-1.5 text-brand-accent hover:text-brand-dark font-bold transition-colors"
                >
                    <Wand2 size={16} />
                    {isDrafting ? 'Redactando...' : 'Asistente de Redacción IA'}
                </button>
              </div>
              <textarea 
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full p-4 bg-brand-light/50 border border-brand-border rounded-xl focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all resize-y leading-relaxed"
                placeholder="Escribe los detalles aquí..."
              />
            </div>

            <div className="border-t border-brand-border/40 pt-6">
                <label className="block text-xs font-bold text-brand-muted/70 uppercase tracking-wider mb-3">Imagen adjunta (Opcional)</label>
                {!imageUrl ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-3 border-2 border-dashed border-brand-border rounded-xl text-brand-muted font-medium hover:bg-brand-light/50 hover:text-brand-accent hover:border-brand-accent transition-all text-sm"
                    >
                        <ImageIcon size={20} /> Seleccionar foto (Max 800KB)
                    </button>
                ) : (
                    <div className="relative inline-block">
                        <img src={imageUrl} alt="Preview" className="h-40 w-auto rounded-xl border border-brand-border shadow-sm object-cover" />
                        <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 hover:scale-110 transition-transform shadow-lg"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    type="submit" 
                    className="bg-brand-accent text-white px-8 py-3 rounded-xl hover:bg-brand-dark font-bold shadow-md transition-colors w-full md:w-auto text-center"
                >
                    Publicar Comunicación
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-brand-border/40 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                 <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${getBadgeColor(notice.type)}`}>
                    {getTypeLabel(notice.type)}
                 </span>
                 <span className="text-brand-muted/80 text-sm font-medium">{new Date(notice.date).toLocaleDateString()}</span>
              </div>
            </div>
            
            <h3 className="text-2xl font-serif font-bold text-brand-dark mb-4 leading-tight">{notice.title}</h3>
            
            {notice.imageUrl && (
                <div className="mb-6 rounded-xl overflow-hidden border border-brand-border/30 bg-brand-light/20">
                    <img src={notice.imageUrl} alt={notice.title} className="w-full h-64 md:h-80 object-cover hover:scale-105 transition duration-700 ease-out" />
                </div>
            )}

            <p className="text-brand-text/90 whitespace-pre-wrap leading-relaxed text-[1.05rem]">{notice.content}</p>
            
            <div className="mt-8 pt-6 border-t border-brand-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-brand-muted font-medium">
                    <div className="w-8 h-8 bg-brand-light rounded-full flex items-center justify-center text-brand-accent font-bold text-sm border border-brand-border shadow-inner">
                        {notice.authorName.charAt(0)}
                    </div>
                    <span>Publicado por <strong className="text-brand-text">{notice.authorName}</strong></span>
                </div>
            </div>
          </div>
        ))}

        {notices.length === 0 && (
            <div className="text-center py-16 text-brand-muted/60 bg-white rounded-3xl border border-dashed border-brand-border/80">
                <div className="w-20 h-20 bg-brand-light/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-border/50">
                    <Tag size={40} className="text-brand-muted/40" />
                </div>
                <p className="text-lg font-medium">No hay comunicaciones publicadas aún.</p>
            </div>
        )}
      </div>
    </div>
  );
};
