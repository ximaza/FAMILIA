import re

with open("server.ts", "r") as f:
    content = f.read()

# 1. Fix user registration duplicates and errors
new_post_users = """
  app.post("/api/users", async (req, res) => {
    try {
      const newUser = req.body;
      const email = newUser.email.toLowerCase();

      let users = [];
      if (db) {
          const snapshot = await db.collection("users").where('email', '==', email).limit(1).get();
          if (!snapshot.empty) {
              return res.status(409).json({ error: "El correo electrónico ya está registrado." });
          }
          const { id, ...data } = newUser;
          await db.collection("users").doc(id).set(data);
          res.json(newUser);
      } else {
          users = (await readData("users.json")) || [];
          if (users.some((u: any) => u.email.toLowerCase() === email)) {
              return res.status(409).json({ error: "El correo electrónico ya está registrado." });
          }
          users.push(newUser);
          await writeData("users.json", users);
          res.json(newUser);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
"""

content = re.sub(
    r'  app\.post\("/api/users", async \(req, res\) => \{\n    try \{\n      const newUser = req\.body;\n      if \(db\) \{\n        const \{ id, \.\.\.data \} = newUser;\n        await db\.collection\("users"\)\.doc\(id\)\.set\(data\);\n        res\.json\(newUser\);\n      \} else \{\n        const users = \(await readData\("users\.json"\)\) \|\| \[\];\n        users\.push\(newUser\);\n        await writeData\("users\.json", users\);\n        res\.json\(newUser\);\n      \}\n    \} catch \(error\) \{\n      console\.error\("Error creating user:", error\);\n      res\.status\(500\)\.json\(\{ error: "Internal Server Error" \}\);\n    \}\n  \}\);',
    new_post_users.strip(),
    content,
    flags=re.MULTILINE
)

with open("server.ts", "w") as f:
    f.write(content)
print("Backend duplicate registration patched")
