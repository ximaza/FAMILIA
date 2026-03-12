import re

with open('server.ts', 'r') as f:
    content = f.read()

# Fix the catch-all routing order issue.
# In express, static middleware handles files that exist.
# Our API routes are defined earlier, so they are matched correctly.
# But there might be a problem with Vite middleware in production.
# Let's completely rework the static serving to be foolproof.

new_server_tail = """
  // Serve public directory
  app.use(express.static(path.join(__dirname, "public")));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    // Development catch-all for SPA
    app.get("*", async (req, res, next) => {
      // Ignore API routes and direct files
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
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));

    // Production catch-all for SPA
    app.get("*", (req, res, next) => {
      // Ignore API routes
      if (req.path.startsWith("/api/")) return next();

      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
"""

# Replace from `// Serve public directory` to the end
content = re.sub(r'  // Serve public directory.*', new_server_tail, content, flags=re.DOTALL)

with open('server.ts', 'w') as f:
    f.write(content)

print("Patched server.ts routing")
