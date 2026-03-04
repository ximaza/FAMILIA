import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';
import { BookOpen } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, loginWithGoogle, register } = useAuth();
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

  const handleGoogleLogin = async () => {
    const email = window.prompt("Introduce tu correo de Google para simular el acceso", "Ximaza@gmail.com");
    if (email) {
      await loginWithGoogle(email);
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
    
    // Send welcome email
    try {
        await fetch('/api/send-welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: newUser.email, 
                name: newUser.firstName 
            })
        });
    } catch (error) {
        console.error("Error calling email API:", error);
    }

    alert('Registro completado. Su cuenta está pendiente de aprobación por un administrador.');
    setIsRegistering(false);
    setFormData({ firstName: '', surname1: '', surname2: '', surname3: '', surname4: '', birthDate: '', parentsNames: '', email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-family-50 flex flex-col justify-center items-center p-4">
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-family-800 rounded-full flex items-center justify-center text-family-100 mx-auto mb-4 shadow-xl">
            <BookOpen size={40} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-family-900 uppercase tracking-wide">FAMILIA MAZARRASA</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-family-200">
        {!isRegistering ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-slate-800">Iniciar Sesión</h2>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Correo Electrónico</label>
                    <input 
                        type="email" 
                        required
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-family-500 outline-none transition"
                        placeholder="tu@email.com"
                        value={loginEmail}
                        onChange={e => setLoginEmail(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
                    <input 
                        type="password" 
                        required
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-family-500 outline-none transition"
                        placeholder="••••••"
                        value={loginPassword}
                        onChange={e => setLoginPassword(e.target.value)}
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-family-700 text-white py-3 rounded-lg font-bold hover:bg-family-800 transition shadow-md"
                >
                    Entrar
                </button>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">o</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-3"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Iniciar con Google
                </button>

                <div className="text-center pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500 mb-2">¿Eres nuevo en la plataforma?</p>
                    <button 
                        type="button"
                        onClick={() => setIsRegistering(true)}
                        className="text-family-600 font-medium hover:underline"
                    >
                        Solicitar Registro
                    </button>
                </div>
                <div className="text-xs text-center text-slate-400">
                    * Primer acceso: <br/><strong>joaquin@maz.com</strong> / <strong>admin123</strong>
                </div>
            </form>
        ) : (
            // Register Form
            <form onSubmit={handleRegister} className="space-y-4">
                <h2 className="text-2xl font-bold text-center text-slate-800 mb-6">Solicitud de Registro</h2>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Nombre</label>
                        <input 
                            required
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.firstName}
                            onChange={e => setFormData({...formData, firstName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">1º Apellido</label>
                        <input 
                            required
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.surname1}
                            onChange={e => setFormData({...formData, surname1: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">2º Apellido</label>
                        <input 
                            required
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.surname2}
                            onChange={e => setFormData({...formData, surname2: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">3º Apellido</label>
                        <input 
                            required
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.surname3}
                            onChange={e => setFormData({...formData, surname3: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">4º Apellido</label>
                        <input 
                            required
                            className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                            value={formData.surname4}
                            onChange={e => setFormData({...formData, surname4: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Fecha Nacimiento</label>
                    <input 
                        type="date"
                        required
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                        value={formData.birthDate}
                        onChange={e => setFormData({...formData, birthDate: e.target.value})}
                    />
                </div>
                
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre de los Padres</label>
                    <input 
                        required
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                        placeholder="Padre y Madre..."
                        value={formData.parentsNames}
                        onChange={e => setFormData({...formData, parentsNames: e.target.value})}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Email de Contacto</label>
                    <input 
                        type="email"
                        required
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">Clave Personal (Mín 6, Alfanumérica)</label>
                    <input 
                        type="password"
                        required
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                        placeholder="Ej: clave123"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                    />
                </div>

                <div className="pt-4 flex gap-3">
                    <button 
                        type="button"
                        onClick={() => setIsRegistering(false)}
                        className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        className="flex-1 bg-family-600 text-white py-3 rounded-lg font-bold hover:bg-family-700 shadow-md"
                    >
                        Enviar
                    </button>
                </div>
            </form>
        )}
      </div>
    </div>
  );
};