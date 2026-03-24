import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { storage } from '../services/storage';
import { Notice } from '../types';
import { Plus, Tag, Wand2, X, Image as ImageIcon, Trash2, Edit2, Calendar } from 'lucide-react';
import { draftNoticeContent } from '../services/geminiService';

export const Notices: React.FC = () => {
  const { currentUser } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Notice['type']>('general');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);  useEffect(() => {
    storage.getNotices().then(setNotices);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (editingId) {
      const updates: Partial<Notice> = {
        title,
        content,
        type,
        imageUrl: imageUrl,
        ...(type === 'event' && eventDate ? { eventDate } : {})
      };
      // If it's not an event, explicitly remove eventDate
      if (type !== 'event') {
          updates.eventDate = undefined;
      }
      await storage.updateNotice(editingId, updates);
    } else {
      const newNotice: Notice = {
        id: Date.now().toString(),
        authorId: currentUser.id,
        authorName: `${currentUser.firstName} ${currentUser.surnames[0]}`,
        title,
        content,
        type,
        imageUrl: imageUrl,
        date: new Date().toISOString(),
        ...(type === 'event' && eventDate ? { eventDate } : {})
      };
      await storage.addNotice(newNotice);
    }

    const updatedNotices = await storage.getNotices();
    setNotices(updatedNotices);
    resetForm();
  };

  const handleEdit = (notice: Notice) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setType(notice.type);
    setImageUrl(notice.imageUrl || '');
    setEventDate(notice.eventDate || '');
    setShowForm(true);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta comunicación?')) {
      await storage.deleteNotice(id);
      const updatedNotices = await storage.getNotices();
      setNotices(updatedNotices);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setType('general');
    setImageUrl('');
    setEventDate('');
    setShowForm(false);
  };  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-serif font-bold text-family-900">Comunicaciones</h2>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-family-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-family-700 transition"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          <span>{showForm ? 'Cancelar' : 'Nueva Comunicación'}</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-family-200 mb-8 animate-fade-in">
          <h3 className="text-lg font-bold mb-4 text-family-800">{editingId ? 'Editar comunicación' : 'Publicar nueva comunicación'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Título / Tema</label>
                    <input 
                        required
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-400 outline-none"
                        placeholder="Ej: Cena de Navidad, Vendo coche..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                    <select 
                        value={type}
                        onChange={(e) => setType(e.target.value as Notice['type'])}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-400 outline-none"
                    >
                        <option value="general">General</option>
                        <option value="event">Evento / Reunión</option>
                        <option value="offer">Oferta / Oportunidad</option>
                    </select>
                </div>
            </div>
            
            {type === 'event' && (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fecha del Evento</label>
                    <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full md:w-1/3 p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-400 outline-none"
                    />
                </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">Contenido</label>
                <button 
                    type="button"
                    onClick={handleAIDraft}
                    disabled={isDrafting}
                    className="text-xs flex items-center gap-1 text-family-600 hover:text-family-800 font-medium"
                >
                    <Wand2 size={14} />
                    {isDrafting ? 'Redactando...' : 'Asistente de Redacción IA'}
                </button>
              </div>
              <textarea 
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-400 outline-none"
                placeholder="Escribe los detalles aquí..."
              />
            </div>

            <div className="border-t border-slate-100 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Imagen adjunta (Opcional)</label>
                {!imageUrl ? (
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition text-sm"
                    >
                        <ImageIcon size={18} /> Seleccionar foto (Max 800KB)
                    </button>
                ) : (
                    <div className="relative inline-block">
                        <img src={imageUrl} alt="Preview" className="h-32 w-auto rounded-lg border border-slate-200" />
                        <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                            <X size={12} />
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

            <div className="flex justify-end pt-2">
                <button 
                    type="submit" 
                    className="bg-family-600 text-white px-6 py-2 rounded-lg hover:bg-family-700 transition"
                >
                    Publicar
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                 <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${getBadgeColor(notice.type)}`}>
                    {getTypeLabel(notice.type)}
                 </span>
                 <span className="text-slate-400 text-sm">{new Date(notice.date).toLocaleDateString()}</span>
              </div>
              {(currentUser?.role === 'admin' || currentUser?.id === notice.authorId) && (
                  <div className="flex gap-2">
                      <button
                          onClick={() => handleEdit(notice)}
                          className="text-slate-400 hover:text-family-600 transition"
                          title="Editar"
                      >
                          <Edit2 size={16} />
                      </button>
                      <button
                          onClick={() => handleDelete(notice.id)}
                          className="text-slate-400 hover:text-red-600 transition"
                          title="Eliminar"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-slate-800 mb-3">{notice.title}</h3>
            
            {notice.type === 'event' && notice.eventDate && (
                <div className="flex items-center gap-2 mb-4 text-family-600 bg-family-50 w-fit px-3 py-1.5 rounded-lg border border-family-100">
                    <Calendar size={16} />
                    <span className="font-medium text-sm">Fecha del evento: {new Date(notice.eventDate).toLocaleDateString()}</span>
                </div>
            )}

            {notice.imageUrl && (
                <div className="mb-4 rounded-lg overflow-hidden border border-slate-100">
                    <img src={notice.imageUrl} alt={notice.title} className="w-full h-64 object-cover" />
                </div>
            )}

            <p className="text-slate-600 whitespace-pre-wrap">{notice.content}</p>
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500">
                <div className="w-6 h-6 bg-family-200 rounded-full flex items-center justify-center text-family-800 font-bold text-xs">
                    {notice.authorName.charAt(0)}
                </div>
                <span>Publicado por {notice.authorName}</span>
            </div>
          </div>
        ))}

        {notices.length === 0 && (
            <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                <Tag size={48} className="mx-auto mb-2 opacity-20" />
                <p>No hay comunicaciones publicadas aún.</p>
            </div>
        )}
      </div>
    </div>
  );
};