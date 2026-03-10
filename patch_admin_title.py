import re

with open("pages/AdminPanel.tsx", "r") as f:
    content = f.read()

# Modify the title to include a version marker
content = re.sub(r'<h2 className="text-2xl font-bold text-family-900 mb-8 flex items-center gap-3">',
                 '<h2 className="text-2xl font-bold text-family-900 mb-8 flex items-center gap-3"> (VERSIÓN DE PRUEBA)', content)

with open("pages/AdminPanel.tsx", "w") as f:
    f.write(content)
