import re

with open("pages/AdminPanel.tsx", "r") as f:
    content = f.read()

content = content.replace(
    '<h2 className="text-3xl font-serif font-bold text-family-900 border-b border-family-200 pb-4">Administración</h2>',
    '<h2 className="text-3xl font-serif font-bold text-family-900 border-b border-family-200 pb-4">Administración (MODO DETECTIVE 🕵️)</h2>'
)

with open("pages/AdminPanel.tsx", "w") as f:
    f.write(content)
