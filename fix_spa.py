import re

with open("server.ts", "r") as f:
    content = f.read()

dev_catchall = """
    // Development catch-all for SPA
    app.use(async (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      if (req.path.includes(".")) return next();
      try {
        const html = await fs.readFile(path.join(__dirname, "index.html"), "utf-8");
        const transformedHtml = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
"""

prod_catchall = """
    // Production catch-all for SPA
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
"""

content = re.sub(r'    // Development catch-all for SPA\n    app\.get\(.*?\}\);', dev_catchall.strip(), content, flags=re.DOTALL)
content = re.sub(r'    // Production catch-all for SPA\n    app\.get\(.*?\}\);', prod_catchall.strip(), content, flags=re.DOTALL)

with open("server.ts", "w") as f:
    f.write(content)

print("Fix reapplied.")
