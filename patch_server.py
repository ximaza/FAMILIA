import re

with open("server.ts", "r") as f:
    content = f.read()

new_routes = """
  app.put("/api/notices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedNotice = req.body;
      if (db) {
        await db.collection("notices").doc(id).update(updatedNotice);
        res.json(updatedNotice);
      } else {
        const notices = (await readData("notices.json")) || [];
        const index = notices.findIndex((n: any) => n.id === id);
        if (index !== -1) {
          notices[index] = { ...notices[index], ...updatedNotice };
          await writeData("notices.json", notices);
          res.json(notices[index]);
        } else {
          res.status(404).json({ error: "Notice not found" });
        }
      }
    } catch (error) {
      console.error("Error updating notice:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/notices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (db) {
        await db.collection("notices").doc(id).delete();
        res.json({ success: true });
      } else {
        const notices = (await readData("notices.json")) || [];
        const filteredNotices = notices.filter((n: any) => n.id !== id);
        await writeData("notices.json", filteredNotices);
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error deleting notice:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
"""

# Find the end of app.post("/api/notices")
pattern = re.compile(r'(  app\.post\("/api/notices".*?^  \}\);)', re.MULTILINE | re.DOTALL)
match = pattern.search(content)

if match:
    new_content = content[:match.end()] + "\n" + new_routes + content[match.end():]
    with open("server.ts", "w") as f:
        f.write(new_content)
    print("Patched server.ts successfully")
else:
    print("Could not find the target block")
