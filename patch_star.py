import re

with open('server.ts', 'r') as f:
    content = f.read()

# For a true catch all without path-to-regexp errors, we can just use an array of paths or `*`?
# In Express 5, `*` is not supported for app.get() directly.
# Wait, actually Express 5 docs say `*` is changed.
# The simplest catch-all in Express is:
# app.use((req, res, next) => { ... })
# Since it's at the end of the file, this acts exactly as `app.get("*")`
content = content.replace('app.get("/:catchAll(.*)", (req, res, next) => {', 'app.use((req, res, next) => {')
content = content.replace('app.get("/:catchAll(.*)", async (req, res, next) => {', 'app.use(async (req, res, next) => {')

with open('server.ts', 'w') as f:
    f.write(content)

print("Patched to app.use")
