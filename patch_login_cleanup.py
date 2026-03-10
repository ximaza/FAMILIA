import re

with open("pages/Login.tsx", "r") as f:
    content = f.read()

content = re.sub(r'<div className="text-xs text-center text-slate-400">\s*\* Primer acceso: <br/><strong>joaquin@maz\.com</strong> / <strong>admin123</strong>\s*</div>', '', content)

with open("pages/Login.tsx", "w") as f:
    f.write(content)
