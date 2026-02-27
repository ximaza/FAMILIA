import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';
import { Search, User as UserIcon, Mail, ArrowLeft, ChevronRight } from 'lucide-react';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      const allUsers = await storage.getUsers();
      setMembers(allUsers.filter(u => u.status === 'active'));
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(user => {
    const term = searchTerm.toLowerCase();
    // Search logic still considers all surnames for finding people, even if we only display 2
    const fullName = `${user.firstName} ${user.surnames.join(' ')}`.toLowerCase();
    const hasSurname = user.surnames.some(s => s.toLowerCase().includes(term));
    return fullName.includes(term) || hasSurname;
  });

  // Detailed View of a Member (Read Only)
  if (selectedMember) {
      return (
          <div className="max-w-3xl mx-auto animate-fade-in">
              <button 
                onClick={() => setSelectedMember(null)}
                className="flex items-center gap-2 text-family-600 hover:text-family-800 mb-6 font-medium transition"
              >
                  <ArrowLeft size={20} /> Volver al listado
              </button>

              <div className="bg-white rounded-xl shadow-lg border border-family-200 overflow-hidden">
                <div className="bg-family-50 p-8 border-b border-family-100 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-32 h-32 bg-white rounded-full p-1 shadow-md flex items-center justify-center overflow-hidden">
                        {selectedMember.photoUrl ? (
                             <img src={selectedMember.photoUrl} alt="Perfil" className="w-full h-full object-cover rounded-full" />
                        ) : (
                             <div className="text-family-200">
                                <UserIcon size={64} />
                             </div>
                        )}
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-serif font-bold text-family-900">
                            {selectedMember.firstName}
                        </h2>
                        <p className="text-xl text-family-600">
                            {selectedMember.surnames.join(' ')}
                        </p>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Fecha de Nacimiento</label>
                            <p className="text-lg text-slate-800 font-medium">
                                {new Date(selectedMember.birthDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Email de Contacto</label>
                             <div className="flex items-center gap-2 text-family-700 font-medium">
                                <Mail size={18} />
                                <a href={`mailto:${selectedMember.email}`} className="hover:underline">
                                    {selectedMember.email}
                                </a>
                             </div>
                        </div>
                        <div className="col-span-full">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nombre de los Padres</label>
                            <p className="text-lg text-slate-800 font-medium border-b border-slate-100 pb-2">
                                {selectedMember.parentsNames}
                            </p>
                        </div>
                        <div className="col-span-full">
                            <label className="text-xs font-bold text-slate-400 uppercase block mb-3">Información Personal / Biografía</label>
                            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
                                {selectedMember.personalInfo ? (
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedMember.personalInfo}
                                    </p>
                                ) : (
                                    <p className="text-slate-400 italic">Este miembro no ha añadido información personal.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
              </div>
          </div>
      );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-family-200 pb-4">
        <div>
            <h2 className="text-3xl font-serif font-bold text-family-900">Family</h2>
            <p className="text-family-600 mt-1">Listado de miembros activos de la familia.</p>
        </div>
      </div>

      <div className="relative">
        <input 
            type="text"
            placeholder="Buscar por nombre o apellido..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-family-200 shadow-sm focus:ring-2 focus:ring-family-400 focus:border-family-400 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-3 top-3.5 text-family-400" size={20} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMembers.map(member => (
            <div 
                key={member.id} 
                onClick={() => setSelectedMember(member)}
                className="bg-white p-4 rounded-xl shadow-sm border border-family-100 hover:border-family-300 hover:shadow-md transition cursor-pointer flex items-center gap-4 group"
            >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-family-50 flex items-center justify-center text-family-700 border border-family-100 group-hover:border-family-400 transition flex-shrink-0">
                     {member.photoUrl ? (
                         <img src={member.photoUrl} alt={member.firstName} className="w-full h-full object-cover" />
                     ) : (
                         <UserIcon size={20} />
                     )}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-family-800 transition">
                        {member.firstName} {member.surnames[0]} {member.surnames[1]}
                    </h3>
                </div>
                <div className="text-slate-300 group-hover:text-family-400 transition">
                    <ChevronRight size={20} />
                </div>
            </div>
        ))}

        {filteredMembers.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">
                <p>No se encontraron miembros con esos criterios.</p>
            </div>
        )}
      </div>
    </div>
  );
};
