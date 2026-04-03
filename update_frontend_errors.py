import os

files = ['pages/Dashboard.tsx', 'pages/Notices.tsx', 'pages/FamilyHistory.tsx', 'pages/Profile.tsx']

for file in files:
    if not os.path.exists(file):
        continue
    with open(file, 'r') as f:
        content = f.read()

    old_alert = 'alert("Hubo un error al subir la imagen. Intenta con otra.");'
    new_alert = 'alert("Error al subir imagen: " + (error instanceof Error ? error.message : String(error)));'

    if old_alert in content:
        content = content.replace(old_alert, new_alert)
        with open(file, 'w') as f:
            f.write(content)
        print(f"Updated errors in {file}")
    else:
        print(f"Could not find target alert in {file}")
