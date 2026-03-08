import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Helper to get clean credentials
  const getEmailConfig = () => {
    // Hardcoding the values provided to ensure they are used exactly
    const user = "camaraberango@gmail.com";
    const pass = "nwnnoladpaxqqqid"; // Removed spaces for maximum compatibility
    
    return { user, pass };
  };

  app.use(express.json());

  // API Routes
  app.post("/api/send-welcome-email", async (req, res) => {
    const { email, name } = req.body;
    const config = getEmailConfig();

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      await transporter.verify();

      const mailOptions = {
        from: `"Familia Mazarrasa" <${config.user}>`,
        to: email,
        subject: "Bienvenido a la Familia Mazarrasa",
        text: `Hola ${name},\n\nBienvenido al sitio de unión de la Familia Mazarrasa. Tu petición está en trámite de aprobación por los administradores. En breve te confirmaremos.`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #935432;">Bienvenido a la Familia Mazarrasa</h2>
            <p>Hola <strong>${name}</strong>,</p>
            <p>Bienvenido al sitio de unión de la Familia Mazarrasa. Tu petición está en trámite de aprobación por los administradores. En breve te confirmaremos.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777;">Este es un mensaje automático, por favor no responda a este correo.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Welcome email sent to ${email}`);
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email", details: error });
    }
  });

  app.post("/api/send-approval-email", async (req, res) => {
    const { email, name } = req.body;
    const config = getEmailConfig();

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: config.user,
          pass: config.pass,
        },
      });

      await transporter.verify();

      const mailOptions = {
        from: `"Familia Mazarrasa" <${config.user}>`,
        to: email,
        subject: "Solicitud Aprobada - Familia Mazarrasa",
        text: `Hola ${name},\n\nSolicitud aprobada, ya puedes acceder a todas nuestras secciones.`,
        html: `
          <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <h2 style="color: #bf834a;">Solicitud Aprobada</h2>
            <p>Hola <strong>${name}</strong>,</p>
            <p>Solicitud aprobada, ya puedes acceder a todas nuestras secciones.</p>
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.APP_URL || '#'}" style="background-color: #935432; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Acceder a la Plataforma</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777;">Este es un mensaje automático, por favor no responda a este correo.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Approval email sent to ${email}`);
      res.json({ success: true, message: "Approval email sent successfully" });
    } catch (error) {
      console.error("Error sending approval email:", error);
      res.status(500).json({ error: "Failed to send email", details: error });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
