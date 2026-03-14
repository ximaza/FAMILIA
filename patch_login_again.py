import re

with open("pages/Login.tsx", "r") as f:
    content = f.read()

# Add the handleForgotPassword function right before return
handle_logic = """
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
"""

content = content.replace("return (", handle_logic + "\n  return (")

# Add the UI for Forgot Password
ui_logic = """
        {isForgotPassword ? (
            // Forgot Password Form
            <form onSubmit={handleForgotPassword} className="space-y-6">
                <h2 className="text-2xl font-bold text-center text-[#935432]">Recuperar Contraseña</h2>
                <p className="text-slate-500 text-center mt-2 text-sm">Introduce tu email para recibir una contraseña temporal.</p>

                {forgotMessage && (
                  <div className="p-3 bg-green-50 text-green-700 rounded-md border border-green-200 text-sm">
                    {forgotMessage}
                  </div>
                )}
                {forgotError && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md border border-red-200 text-sm">
                    {forgotError}
                  </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Correo Electrónico</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#935432] focus:border-transparent transition-all outline-none text-slate-800"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-[#935432] hover:bg-[#7a4529] text-white py-3 rounded-lg font-semibold transition-colors shadow-md hover:shadow-lg mt-4"
                >
                    Enviar Contraseña
                </button>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => {
                            setIsForgotPassword(false);
                            setForgotMessage('');
                            setForgotError('');
                        }}
                        className="text-[#935432] hover:text-[#7a4529] font-medium"
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            </form>
        ) : !isRegistering ? (
"""

content = content.replace("{!isRegistering ? (", ui_logic)

# Replace the password label block to add the "Forgot Password?" link
old_pwd = """<label className="block text-sm font-medium text-slate-600 mb-1">Contraseña</label>
                    <input
                        type="password" """

new_pwd = """
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-600">Contraseña</label>
                        <button type="button" onClick={() => setIsForgotPassword(true)} className="text-xs text-[#935432] hover:text-[#7a4529] font-medium">¿Olvidaste tu contraseña?</button>
                    </div>
                    <input
                        type="password" """

content = content.replace(old_pwd, new_pwd)

with open("pages/Login.tsx", "w") as f:
    f.write(content)

print("Applied fix_login_again")
