import re

with open('server.ts', 'r') as f:
    content = f.read()

# Make sure development catch-all handles API correctly
dev_catchall = r'app\.get\(\/^\/\\\(?!api\\\/\|direct-admin\|admin\\\.html\)\.\*\/'

# Actually, the problem is that /api/users is returning index.html
# Let's add console.log(req.path) to see what's happening

with open('server.ts', 'w') as f:
    f.write(content.replace(
        'app.get(/^\/(?!api\/|direct-admin|admin\.html).*/, async (req, res, next) => {',
        'app.get(/^\/(?!api\/|direct-admin|admin\.html).*/, async (req, res, next) => {\n      console.log("DEV CATCHALL HIT:", req.path);'
    ).replace(
        'app.get(/^\/(?!api\/|direct-admin|admin\.html).*/, (req, res) => {',
        'app.get(/^\/(?!api\/|direct-admin|admin\.html).*/, (req, res) => {\n      console.log("PROD CATCHALL HIT:", req.path);'
    ))

print("Patched server.ts")
