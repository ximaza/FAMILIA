import re

with open("server.ts", "r") as f:
    content = f.read()

emergency_login = """
  // API Routes
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    // EMERGENCY OVERRIDE FOR ADMIN RECOVERY
    if (email.toLowerCase() === 'joaquin@maz.com' && password === 'admin123') {
        const adminUser = {
            id: "admin-1",
            firstName: "Joaquín",
            surnames: ["Mazarrasa", "", "", ""],
            email: "joaquin@maz.com",
            role: "admin",
            status: "active"
        };
        // Attempt to repair DB while logging in
        try {
            if (db) {
                await db.collection("users").doc("admin-1").set({...adminUser, password: "admin123"}, { merge: true });
            }
        } catch(e) {}

        return res.json(adminUser);
    }

    let users = [];
"""

content = content.replace('  // API Routes\n  app.post("/api/login", async (req, res) => {\n    const { email, password } = req.body;\n    let users = [];', emergency_login.strip())

with open("server.ts", "w") as f:
    f.write(content)
