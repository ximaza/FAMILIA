import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { BookOpen } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register State
  const [formData, setFormData] = useState({
    firstName: '',
    surname1: '', surname2: '', surname3: '', surname4: '',
    birthDate: '',
    parentsNames: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    
    const success = await login(loginEmail, loginPassword);
    if (!success) {
        alert("Usuario no encontrado, contraseña incorrecta o cuenta no aprobada.");
    }
  };

  const validatePassword = (pwd: string): boolean => {
      // Check length >= 6
      if (pwd.length < 6) return false;
      // Check alphanumeric (only letters and numbers allowed, must generally contain both implies alphanumeric logic)
      // Regex: ^[a-zA-Z0-9]+$ ensures only alphanumeric chars.
      const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(pwd);
      return isAlphanumeric;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (!validatePassword(formData.password)) {
        alert("La contraseña debe tener mínimo 6 caracteres y ser alfanumérica (solo letras y números).");
        return;
    }

    // Basic Maz validation (Mock)
    const allSurnames = [formData.surname1, formData.surname2, formData.surname3, formData.surname4];
    const hasMaz = allSurnames.some(s => s.toUpperCase().includes('MAZ')); // Relaxed check for MAZARRASA or similar
    
    // Optionally check specifically for MAZARRASA if strictly required, but keeping 'MAZ' covers it.
    
    if (!hasMaz) {
        if(!window.confirm("Advertencia: No hemos detectado 'MAZ' en los apellidos introducidos. ¿Desea continuar con el registro de todas formas?")) {
            return;
        }
    }

    const newUser: User = {
        id: Date.now().toString(),
        firstName: formData.firstName,
        surnames: [formData.surname1, formData.surname2, formData.surname3, formData.surname4],
        birthDate: formData.birthDate,
        parentsNames: formData.parentsNames,
        email: formData.email,
        password: formData.password,
        role: 'member',
        status: 'pending_approval',
        registeredAt: new Date().toISOString()
    };

    await register(newUser);
    
    // Send welcome email via EmailJS
    try {
        // @ts-ignore - emailjs is loaded globally via index.html
        if (window.emailjs) {
            // @ts-ignore
            await window.emailjs.send(
                "YOUR_SERVICE_ID", // TODO: Replace with your EmailJS service ID
                "YOUR_WELCOME_TEMPLATE_ID", // TODO: Replace with your Welcome Email Template ID
                {
                    to_email: newUser.email,
                    to_name: newUser.firstName,
                }
            );
            console.log("Welcome email sent via EmailJS");
        } else {
            console.warn("EmailJS is not loaded.");
        }
    } catch (error) {
        console.error("Error sending welcome email via EmailJS:", error);
    }

    alert('Registro completado. Su cuenta está pendiente de aprobación por un administrador.');
    setIsRegistering(false);
    setFormData({ firstName: '', surname1: '', surname2: '', surname3: '', surname4: '', birthDate: '', parentsNames: '', email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 bg-brand-dark rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
              <BookOpen size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-brand-dark uppercase tracking-widest">FAMILIA MAZARRASA</h1>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[1.25rem] shadow-card w-full border border-brand-border/40">
          {!isRegistering ? (
              // Login Form
              <form onSubmit={handleLogin} className="space-y-6">
                  <h2 className="text-[1.35rem] font-bold text-center text-brand-text mb-8 tracking-wide">Iniciar Sesión</h2>
                  <div>
                      <label className="block text-[0.85rem] font-bold text-brand-muted/90 mb-2">Correo Electrónico</label>
                      <input
                          type="email"
                          required
                          className="w-full p-3 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all placeholder:text-brand-muted/50"
                          placeholder="tu@email.com"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                      />
                  </div>
                  <div>
                      <label className="block text-[0.85rem] font-bold text-brand-muted/90 mb-2">Contraseña</label>
                      <input
                          type="password"
                          required
                          className="w-full p-3 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-brand-accent outline-none transition-all placeholder:text-brand-muted/50 text-2xl tracking-widest pt-4 pb-2"
                          placeholder="••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                      />
                  </div>
                  <button
                      type="submit"
                      className="w-full bg-brand-accent text-white py-3.5 rounded-lg font-bold hover:bg-brand-dark transition-colors shadow-sm mt-4 text-sm"
                  >
                      Entrar
                  </button>
                  <div className="text-center pt-8 mt-4 border-t border-brand-border/40">
                      <p className="text-[0.9rem] text-brand-muted/90 mb-2">¿Eres nuevo en la plataforma?</p>
                      <button
                          type="button"
                          onClick={() => setIsRegistering(true)}
                          className="text-brand-accent font-bold hover:text-brand-dark transition-colors text-base"
                      >
                          Solicitar Registro
                      </button>
                  </div>
              </form>
          ) : (
              // Register Form
              <form onSubmit={handleRegister} className="space-y-5">
                  <h2 className="text-[1.35rem] font-bold text-center text-brand-text mb-6 tracking-wide">Solicitud de Registro</h2>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                          <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">NOMBRE</label>
                          <input
                              required
                              className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                              value={formData.firstName}
                              onChange={e => setFormData({...formData, firstName: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">1º APELLIDO</label>
                          <input
                              required
                              className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                              value={formData.surname1}
                              onChange={e => setFormData({...formData, surname1: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">2º APELLIDO</label>
                          <input
                              required
                              className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                              value={formData.surname2}
                              onChange={e => setFormData({...formData, surname2: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">3º APELLIDO</label>
                          <input
                              required
                              className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                              value={formData.surname3}
                              onChange={e => setFormData({...formData, surname3: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">4º APELLIDO</label>
                          <input
                              required
                              className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                              value={formData.surname4}
                              onChange={e => setFormData({...formData, surname4: e.target.value})}
                          />
                      </div>
                  </div>

                  <div>
                      <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">FECHA NACIMIENTO</label>
                      <input
                          type="date"
                          required
                          className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all text-brand-text"
                          value={formData.birthDate}
                          onChange={e => setFormData({...formData, birthDate: e.target.value})}
                      />
                  </div>

                  <div>
                      <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">NOMBRE DE LOS PADRES</label>
                      <input
                          required
                          className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-brand-muted/50"
                          placeholder="Padre y Madre..."
                          value={formData.parentsNames}
                          onChange={e => setFormData({...formData, parentsNames: e.target.value})}
                      />
                  </div>

                  <div>
                      <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">EMAIL DE CONTACTO</label>
                      <input
                          type="email"
                          required
                          className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                  </div>

                  <div>
                      <label className="text-[0.7rem] font-bold text-brand-muted/90 uppercase tracking-wider mb-1 block">CLAVE PERSONAL (MÍN 6, ALFANUMÉRICA)</label>
                      <input
                          type="password"
                          required
                          className="w-full p-2.5 bg-white border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-accent outline-none transition-all placeholder:text-brand-muted/50"
                          placeholder="Ej: clave123"
                          value={formData.password}
                          onChange={e => setFormData({...formData, password: e.target.value})}
                      />
                  </div>

                  <div className="pt-6 flex gap-4 mt-6">
                      <button
                          type="button"
                          onClick={() => setIsRegistering(false)}
                          className="flex-1 py-3 text-brand-text font-bold hover:bg-brand-light rounded-lg transition-colors bg-white border-none"
                      >
                          Cancelar
                      </button>
                      <button
                          type="submit"
                          className="flex-1 bg-brand-accent text-white py-3 rounded-lg font-bold hover:bg-brand-dark transition-colors shadow-sm"
                      >
                          Enviar
                      </button>
                  </div>
              </form>
          )}
        </div>
      </div>
    </div>
  );
};