import re

with open("server.ts", "r") as f:
    content = f.read()

new_endpoint = """
  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        let users = [];
        if (db) {
            const snapshot = await db.collection("users").get();
            users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            users = (await readData("users.json")) || [];
        }

        const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            // For security, don't reveal if the user exists or not, just return success
            return res.json({ success: true, message: "If the email exists, a new password has been sent." });
        }

        // Generate a random 8 character alphanumeric temporary password
        const tempPassword = Math.random().toString(36).slice(-8);

        // Update the database
        if (db) {
            await db.collection("users").doc(user.id).set({ password: tempPassword }, { merge: true });
        } else {
            const updatedUsers = users.map((u: any) => u.id === user.id ? { ...u, password: tempPassword } : u);
            await writeData("users.json", updatedUsers);
        }

        // Send Email
        const config = getEmailConfig();
        if (config.user && config.pass) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: config.user, pass: config.pass },
            });
            await transporter.sendMail({
                from: `"Familia Mazarrasa" <${config.user}>`,
                to: email,
                subject: "Recuperación de Contraseña - Familia Mazarrasa",
                text: `Hola ${user.firstName},\n\nTu nueva contraseña temporal es: ${tempPassword}\n\nPor favor, entra al sistema y cámbiala lo antes posible en tu perfil.`,
                html: `
                  <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #935432;">Recuperación de contraseña</h2>
                    <p>Hola <strong>${user.firstName}</strong>,</p>
                    <p>Has solicitado recuperar tu contraseña. Te hemos generado una nueva contraseña temporal:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; letter-spacing: 2px;">
                      ${tempPassword}
                    </div>
                    <p>Por favor, usa esta contraseña para entrar y ve a la sección "Mi Perfil" para cambiarla por una nueva inmediatamente.</p>
                  </div>
                `
            });
            console.log(`Password recovery email sent to ${email}`);
        }

        res.json({ success: true, message: "If the email exists, a new password has been sent." });
    } catch (e) {
        console.error("Forgot password error:", e);
        res.status(500).json({ error: "Server error" });
    }
  });

  // Serve public directory
"""

content = content.replace("  // Serve public directory", new_endpoint)

with open("server.ts", "w") as f:
    f.write(content)

print("Added /api/forgot-password endpoint")
