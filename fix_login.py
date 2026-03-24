import re

with open("pages/Login.tsx", "r") as f:
    content = f.read()

# Make sure state variables are inserted correctly.
if 'isForgotPassword' not in content:
    content = content.replace(
        "const [isRegistering, setIsRegistering] = useState(false);",
        "const [isRegistering, setIsRegistering] = useState(false);\n  const [isForgotPassword, setIsForgotPassword] = useState(false);\n  const [forgotEmail, setForgotEmail] = useState('');\n  const [forgotMessage, setForgotMessage] = useState('');\n  const [forgotError, setForgotError] = useState('');"
    )

if 'handleForgotPassword' not in content:
    logic = """
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    try {
        const res = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: forgotEmail })
        });
        if (res.ok) {
            setForgotMessage('Si el correo existe, se ha enviado una nueva contraseña temporal.');
            setForgotEmail('');
        } else {
            setForgotError('Hubo un error al procesar tu solicitud.');
        }
    } catch(err) {
        setForgotError('Hubo un error de conexión.');
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#935432]">Recuperar Contraseña</h1>
            <p className="text-slate-500 mt-2">Introduce tu email para recibir una contraseña temporal.</p>
          </div>
          {forgotMessage && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md border border-green-200">
              {forgotMessage}
            </div>
          )}
          {forgotError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md border border-red-200">
              {forgotError}
            </div>
          )}
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#935432] focus:border-[#935432]"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#935432] hover:bg-[#7a4529] text-white py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              Enviar Contraseña
            </button>
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setForgotMessage('');
                  setForgotError('');
                }}
                className="text-[#935432] hover:text-[#7a4529] font-medium"
              >
                Volver al Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
"""
    content = content.replace("  if (isRegistering) {", logic + "\n  if (isRegistering) {")

if '¿Olvidaste tu contraseña?' not in content:
    content = content.replace(
        '<label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>',
        """
        <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-slate-700">Contraseña</label>
            <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm text-[#935432] hover:text-[#7a4529] font-medium">¿Olvidaste tu contraseña?</button>
        </div>
        """
    )

with open("pages/Login.tsx", "w") as f:
    f.write(content)

print("Double checked Login patch")
