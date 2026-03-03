import React, { useState, useEffect } from 'react';
import { storage } from '../services/storage';
import { User } from '../types';
import { Search, User as UserIcon, Mail, ArrowLeft, ChevronRight } from 'lucide-react';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  useEffect(() => {
    // Only show active members (approved)
    const loadMembers = async () => {
      const allUsers = await storage.getUsers();
      setMembers(allUsers.filter(u => u.status === 'active'));
    };
    loadMembers();
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
          <div className="max-w-2xl mx-auto animate-fade-in pt-4">
              <button 
                onClick={() => setSelectedMember(null)}
                className="flex items-center gap-2 text-brand-dark hover:text-brand-accent mb-6 font-medium transition-colors"
              >
                  <ArrowLeft size={20} /> Volver al listado
              </button>

              <div className="bg-white rounded-3xl shadow-card border border-brand-border/40 overflow-hidden">
                <div className="bg-brand-light/30 p-10 border-b border-brand-border/50 flex flex-col items-center gap-4 text-center">
                    <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-md flex items-center justify-center overflow-hidden border border-brand-border">
                        {selectedMember.photoUrl ? (
                             <img src={selectedMember.photoUrl} alt="Perfil" className="w-full h-full object-cover rounded-full" />
                        ) : (
                             <div className="text-brand-muted/40 bg-brand-light w-full h-full rounded-full flex items-center justify-center">
                                <UserIcon size={64} strokeWidth={1.5} />
                             </div>
                        )}
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-brand-dark tracking-wide">
                            {selectedMember.firstName}
                        </h2>
                        <p className="text-lg text-brand-muted mt-1">
                            {selectedMember.surnames.slice(0, 2).join(' ')}
                        </p>
                    </div>
                </div>

                <div className="p-8 md:p-10">
                    <div className="space-y-8">
                        <div>
                            <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-2">Fecha de Nacimiento</label>
                            <p className="text-base text-brand-text font-bold">
                                {new Date(selectedMember.birthDate).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-2">Email de Contacto</label>
                             <div className="flex items-center gap-2 text-brand-dark font-medium">
                                <Mail size={18} className="text-brand-accent" />
                                <a href={`mailto:${selectedMember.email}`} className="hover:text-brand-accent transition-colors">
                                    {selectedMember.email}
                                </a>
                             </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-2">Nombre de los Padres</label>
                            <p className="text-base text-brand-text font-bold border-b border-brand-border/30 pb-4">
                                {selectedMember.parentsNames}
                            </p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-brand-muted/70 uppercase tracking-wider block mb-3">Información Personal / Biografía</label>
                            <div className="bg-brand-light/20 p-5 rounded-2xl border border-brand-border/30">
                                {selectedMember.personalInfo ? (
                                    <p className="text-brand-text/90 leading-relaxed whitespace-pre-wrap text-sm">
                                        {selectedMember.personalInfo}
                                    </p>
                                ) : (
                                    <p className="text-brand-muted italic text-sm">Este miembro no ha añadido información personal.</p>
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
    <div className="max-w-3xl mx-auto space-y-6 pt-4">
      <div className="text-center md:text-left mb-8 border-b border-brand-border/50 pb-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark mb-1">Family</h2>
        <p className="text-sm md:text-base text-brand-accent">Listado de miembros activos de la familia.</p>
      </div>

      <div className="relative mb-8">
        <input 
            type="text"
            placeholder="Buscar por nombre o apellido..."
            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-brand-border shadow-sm focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all placeholder:text-brand-muted/60"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-4 top-4 text-brand-accent" size={20} />
      </div>

      <div className="space-y-3">
        {filteredMembers.map(member => (
            <div 
                key={member.id} 
                onClick={() => setSelectedMember(member)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-brand-border/60 hover:border-brand-accent hover:shadow-card transition-all cursor-pointer flex items-center gap-5 group"
            >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-light flex items-center justify-center text-brand-accent border border-brand-border/50 group-hover:border-brand-accent transition-colors flex-shrink-0">
                     {member.photoUrl ? (
                         <img src={member.photoUrl} alt={member.firstName} className="w-full h-full object-cover" />
                     ) : (
                         <UserIcon size={24} strokeWidth={1.5} />
                     )}
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-brand-text text-lg group-hover:text-brand-dark transition-colors">
                        {member.firstName} {member.surnames[0]} {member.surnames[1]}
                    </h3>
                </div>
                <div className="text-brand-border group-hover:text-brand-accent transition-colors pr-2">
                    <ChevronRight size={24} />
                </div>
            </div>
        ))}

        {filteredMembers.length === 0 && (
            <div className="text-center py-12 text-brand-muted bg-white rounded-2xl border border-brand-border/50">
                <Search className="mx-auto mb-3 opacity-30" size={32} />
                <p>No se encontraron miembros con esos criterios.</p>
            </div>
        )}
      </div>
    </div>
  );
};
