import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper to get clean credentials
  const getEmailConfig = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    
    return { user, pass };
  };

  app.use(express.json({ limit: '2mb' }));

  const DATA_DIR = path.join(__dirname, "data");

  const readData = async (filename: string) => {
    const filePath = path.join(DATA_DIR, filename);
    try {
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading ${filename}:`, error);
      return null;
    }
  };

  const writeData = async (filename: string, data: any) => {
    const filePath = path.join(DATA_DIR, filename);
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
      return true;
    } catch (error) {
      console.error(`Error writing ${filename}:`, error);
      return false;
    }
  };

  // API Routes
  app.get("/api/users", async (req, res) => {
    const users = await readData("users.json");
    res.json(users || []);
  });

  app.post("/api/users", async (req, res) => {
    const newUser = req.body;
    const users = (await readData("users.json")) || [];
    users.push(newUser);
    await writeData("users.json", users);
    res.json(newUser);
  });

  app.put("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;
    let users = (await readData("users.json")) || [];
    users = users.map((u: any) => u.id === id ? updatedUser : u);
    await writeData("users.json", users);
    res.json(updatedUser);
  });

  app.delete("/api/users/:id", async (req, res) => {
    const { id } = req.params;
    let users = (await readData("users.json")) || [];
    users = users.filter((u: any) => u.id !== id);
    await writeData("users.json", users);
    res.json({ success: true });
  });

  app.get("/api/notices", async (req, res) => {
    const notices = await readData("notices.json");
    res.json(notices || []);
  });

  app.post("/api/notices", async (req, res) => {
    const newNotice = req.body;
    const notices = (await readData("notices.json")) || [];
    notices.unshift(newNotice);
    await writeData("notices.json", notices);
    res.json(newNotice);
  });

  app.get("/api/history", async (req, res) => {
    const history = await readData("history.json");
    res.json(history);
  });

  app.post("/api/history", async (req, res) => {
    const history = req.body;
    await writeData("history.json", history);
    res.json(history);
  });

  app.get("/api/homepage", async (req, res) => {
    const homepage = await readData("homepage.json");
    res.json(homepage);
  });

  app.post("/api/homepage", async (req, res) => {
    const homepage = req.body;
    await writeData("homepage.json", homepage);
    res.json(homepage);
  });

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
