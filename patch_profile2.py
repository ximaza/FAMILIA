import re

with open("pages/Profile.tsx", "r") as f:
    content = f.read()

# I missed updating handleSave because the actual logic was different.
# Let's replace the top of handleSave.

new_logic = """
  const handleSave = async () => {
    if (!currentUser || !formData.id) return;

    let passToUpdate = currentUser.password;
    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setPasswordError('Las contraseñas no coinciden');
        return;
      }
      if (newPassword.length < 6) {
        setPasswordError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      passToUpdate = newPassword;
    }

    const updatedUser: User = {
        ...currentUser,
        firstName: formData.firstName || currentUser.firstName,
        surnames: (formData.surnames || currentUser.surnames) as [string, string, string, string],
        birthDate: formData.birthDate || currentUser.birthDate,
        parentsNames: formData.parentsNames || currentUser.parentsNames,
        email: formData.email || currentUser.email,
        personalInfo: formData.personalInfo || '',
        password: passToUpdate
"""

content = re.sub(
    r'  const handleSave = async \(\) => \{\n    if \(!currentUser \|\| !formData.id\) return;\n    \n    const updatedUser: User = \{\n        ...currentUser,\n        firstName: formData.firstName \|\| currentUser.firstName,\n        surnames: \(formData.surnames \|\| currentUser.surnames\) as \[string, string, string, string\],\n        birthDate: formData.birthDate \|\| currentUser.birthDate,\n        parentsNames: formData.parentsNames \|\| currentUser.parentsNames,\n        email: formData.email \|\| currentUser.email,\n        personalInfo: formData.personalInfo \|\| \'\',',
    new_logic.strip(),
    content,
    flags=re.MULTILINE
)

# And clear the password fields on success
content = content.replace("setIsEditing(false);\n      alert('Perfil actualizado con éxito');", "setIsEditing(false);\n      setNewPassword('');\n      setConfirmPassword('');\n      setPasswordError('');\n      alert('Perfil actualizado con éxito');")

with open("pages/Profile.tsx", "w") as f:
    f.write(content)

print("Applied patch_profile2")
