import re

with open("pages/Profile.tsx", "r") as f:
    content = f.read()

# 1. Add state for new password
state_vars = """
  const [formData, setFormData] = useState<Partial<User>>({...currentUser});
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
"""
content = re.sub(r'const \[formData, setFormData\] = useState<Partial<User>>\(\{...currentUser\}\);', state_vars.strip(), content)

# 2. Modify handleSave to check passwords
save_logic = """
  const handleSave = async () => {
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      formData.password = newPassword;
    }

    try {
      await storage.updateUser({ ...currentUser, ...formData } as User);
      setIsEditing(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
      alert('Perfil actualizado con éxito.');
"""
content = re.sub(r'const handleSave = async \(\) => \{\n    try \{\n      await storage\.updateUser\(\{ \.\.\.currentUser, \.\.\.formData \} as User\);\n      setIsEditing\(false\);\n      alert\(\'Perfil actualizado con éxito\.\'\);', save_logic.strip(), content)

# 3. Add UI for Password Change
password_ui = """
                <div className="col-span-2 mt-8 pt-6 border-t border-slate-100">
                    <label className="text-sm font-bold text-family-800 uppercase block mb-2 flex items-center gap-2">
                         Seguridad
                    </label>
                    <p className="text-xs text-slate-500 mb-4">Si deseas cambiar tu contraseña, escríbela a continuación. Si la dejas en blanco, tu contraseña actual se mantendrá.</p>

                    {passwordError && (
                      <div className="mb-4 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                        {passwordError}
                      </div>
                    )}

                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                                    placeholder="Dejar en blanco para no cambiar"
                                    value={newPassword}
                                    onChange={(e) => {
                                      setNewPassword(e.target.value);
                                      setPasswordError('');
                                    }}
                                />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Confirmar Nueva Contraseña</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                                    placeholder="Repite la nueva contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => {
                                      setConfirmPassword(e.target.value);
                                      setPasswordError('');
                                    }}
                                />
                             </div>
                        </div>
                    ) : (
                        <div className="bg-family-50 p-4 rounded-lg border border-family-100 text-slate-500 text-sm italic">
                            Pulsa en "Editar Datos" para cambiar tu contraseña.
                        </div>
                    )}
                </div>

                <div className="col-span-2 mt-4 pt-6 border-t border-slate-100">
"""

content = content.replace('<div className="col-span-2 mt-4">', password_ui)

with open("pages/Profile.tsx", "w") as f:
    f.write(content)

print("Applied fix_profile")
