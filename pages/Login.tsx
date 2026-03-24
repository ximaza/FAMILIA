import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User } from '../types';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);
  const { login, register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surnames, setSurnames] = useState<[string, string, string, string]>(['', '', '', '']);
  const [birthDate, setBirthDate] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [personalInfo, setPersonalInfo] = useState('');

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegistering) {
        const newUser: User = {
          id: crypto.randomUUID(),
          firstName,
          surnames,
          birthDate,
          fatherName,
          motherName,
          email: email.toLowerCase(),
          password,
          personalInfo,
          role: 'member',
          status: 'pending_approval',
          registeredAt: new Date().toISOString()
        };
        await register(newUser);
        setIsRegisterSuccess(true);
      } else {
        const success = await login(email.toLowerCase(), password);
        if (!success) {
          setError('Email o contraseña incorrectos.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Ocurrió un error. Inténtalo de nuevo.');
    }
  };

  if (isRegisterSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <h2 className="text-2xl font-bold text-green-600 mb-4">Registro enviado con éxito</h2>
            <p className="text-gray-600 mb-6">Su cuenta está pendiente de aprobación por el administrador. Recibirá un correo electrónico cuando sea aprobada.</p>
            <button
              onClick={() => {
                setIsRegisterSuccess(false);
                setIsRegistering(false);
              }}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Volver al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isRegistering ? 'Crear una cuenta' : 'Iniciar sesión'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isRegistering && (
              <>
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">Nombre</label>
                  <div className="mt-1">
                    <input id="firstName" name="firstName" type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Primer Apellido</label>
                    <input type="text" required value={surnames[0]} onChange={(e) => { const newSurnames = [...surnames] as [string, string, string, string]; newSurnames[0] = e.target.value; setSurnames(newSurnames); }} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Segundo Apellido</label>
                    <input type="text" value={surnames[1]} onChange={(e) => { const newSurnames = [...surnames] as [string, string, string, string]; newSurnames[1] = e.target.value; setSurnames(newSurnames); }} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tercer Apellido</label>
                    <input type="text" value={surnames[2]} onChange={(e) => { const newSurnames = [...surnames] as [string, string, string, string]; newSurnames[2] = e.target.value; setSurnames(newSurnames); }} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cuarto Apellido</label>
                    <input type="text" value={surnames[3]} onChange={(e) => { const newSurnames = [...surnames] as [string, string, string, string]; newSurnames[3] = e.target.value; setSurnames(newSurnames); }} className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                  <div className="mt-1">
                    <input id="birthDate" name="birthDate" type="date" required value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700">Nombre del Padre</label>
                  <div className="mt-1">
                    <input id="fatherName" name="fatherName" type="text" value={fatherName} onChange={(e) => setFatherName(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label htmlFor="motherName" className="block text-sm font-medium text-gray-700">Nombre de la Madre</label>
                  <div className="mt-1">
                    <input id="motherName" name="motherName" type="text" value={motherName} onChange={(e) => setMotherName(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>

                <div>
                  <label htmlFor="personalInfo" className="block text-sm font-medium text-gray-700">Información Personal (Opcional)</label>
                  <div className="mt-1">
                    <textarea id="personalInfo" name="personalInfo" rows={3} value={personalInfo} onChange={(e) => setPersonalInfo(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete={isRegistering ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm font-medium text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-yellow-400 hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                {isRegistering ? 'Enviar' : 'Entrar'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
