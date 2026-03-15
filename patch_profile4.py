import re

with open("pages/Profile.tsx", "r") as f:
    content = f.read()

# Fix potential crashes when mapping over surnames
content = content.replace("currentUser.surnames.map((s, i) => s && (", "(currentUser.surnames || []).map((s, i) => s && (")

# Also ensure formData.surnames is safe when loading
content = content.replace("surnames: (formData.surnames || currentUser.surnames) as [string, string, string, string],", "surnames: (formData.surnames || currentUser.surnames || ['', '', '', '']) as [string, string, string, string],")

# Fix Date display if birthDate is invalid or missing
date_logic_old = "{new Date(currentUser.birthDate).toLocaleDateString()}"
date_logic_new = "{currentUser.birthDate ? new Date(currentUser.birthDate).toLocaleDateString() : 'No especificada'}"
content = content.replace(date_logic_old, date_logic_new)

with open("pages/Profile.tsx", "w") as f:
    f.write(content)

print("Profile crash fixes applied.")
