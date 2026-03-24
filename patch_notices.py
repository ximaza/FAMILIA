with open("pages/Notices.tsx", "r") as f:
    content = f.read()

# Add edit capabilities
import re

# Imports
content = content.replace("import { Plus, Tag, Wand2, X, Image as ImageIcon, Trash2 } from 'lucide-react';", "import { Plus, Tag, Wand2, X, Image as ImageIcon, Trash2, Edit2, Calendar } from 'lucide-react';")

# State
state_block = """  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<Notice['type']>('general');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [eventDate, setEventDate] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);"""
content = re.sub(r'  // Form State.*?(?=  useEffect)', state_block, content, flags=re.MULTILINE | re.DOTALL)


# Handlers
handlers_block = """  const handleSubmit = async (e: React.FormEvent) => {
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
  };"""

content = re.sub(r'  const handleSubmit = async \(e: React\.FormEvent\) => \{.*?(?=  const handleImageUpload)', handlers_block, content, flags=re.MULTILINE | re.DOTALL)


# Title
content = content.replace("Publicar nueva comunicación", "{editingId ? 'Editar comunicación' : 'Publicar nueva comunicación'}")
content = content.replace(">Publicar<", ">{editingId ? 'Guardar Cambios' : 'Publicar'}<")


# Event Date Input
event_date_input = """                <div>
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
            )}"""

content = re.sub(r'                <div>\s*<label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>.*?</div>\s*</div>', event_date_input, content, flags=re.MULTILINE | re.DOTALL)


# Card Buttons
card_buttons = """              <div className="flex items-center gap-3">
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
            )}"""

content = re.sub(r'              <div className="flex items-center gap-3">.*?<h3 className="text-xl font-bold text-slate-800 mb-3">\{notice.title\}</h3>', card_buttons, content, flags=re.MULTILINE | re.DOTALL)

with open("pages/Notices.tsx", "w") as f:
    f.write(content)
