import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import admin from "firebase-admin";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
let db: admin.firestore.Firestore | null = null;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    db = admin.firestore();
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase credentials missing. Falling back to local JSON storage.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

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
      // Return empty array for known array files, empty object for others
      if (filename.includes('users') || filename.includes('notices')) return [];
      return {};
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
  app.post("/api/login", async (req, res) => {
    try {
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

      let users: any[] = [];
      if (db) {
        // Optimized query per memory instructions
        const snapshot = await db.collection("users").where('email', '==', email.toLowerCase()).limit(1).get();
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            users = [{ id: doc.id, ...doc.data() }];
        }
      } else {
        users = (await readData("users.json")) || [];
      }

      const user = users.find((u: any) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (user) {
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Fetch user role helper
  const getUserRole = async (userId: string | undefined): Promise<string | null> => {
    if (!userId) return null;
    try {
      if (db) {
        const doc = await db.collection("users").doc(userId).get();
        if (doc.exists) return doc.data()?.role || null;
      } else {
        const users = (await readData("users.json")) || [];
        const user = (users || []).find((u: any) => u.id === userId);
        if (user) return user.role;
      }
    } catch (e) {
      console.error("Error fetching user role", e);
    }
    return null;
  };

  // Check if user is an admin or the user themselves (for updates/deletes)
  const isAuthorizedToModify = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestingUserId = req.headers['x-user-id'] as string;
    const targetUserId = req.params.id;

    console.log(`[isAuthorizedToModify] Requesting: ${requestingUserId}, Target: ${targetUserId}, Method: ${req.method}`);

    if (!requestingUserId) {
        console.log(`[isAuthorizedToModify] REJECTED 401: No x-user-id header`);
        return res.status(401).json({ error: "Unauthorized: Missing header" });
    }

    if (requestingUserId === targetUserId) {
        console.log(`[isAuthorizedToModify] ALLOWED: Self modification`);
        return next();
    }

    const role = await getUserRole(requestingUserId);
    console.log(`[isAuthorizedToModify] Retrieved role for ${requestingUserId}: ${role}`);

    if (role === 'admin') {
        console.log(`[isAuthorizedToModify] ALLOWED: Admin modification`);
        return next();
    }

    console.log(`[isAuthorizedToModify] REJECTED 403: Role is not admin`);
    return res.status(403).json({ error: "Forbidden: Not admin" });
  };

  app.get("/api/users", async (req, res) => {
    const requestingUserId = req.headers['x-user-id'] as string;
    const role = await getUserRole(requestingUserId);
    const isAdmin = role === 'admin';

    try {
        if (db) {
          const snapshot = await db.collection("users").get();
          const users = snapshot.docs.map(doc => {
              const data = doc.data();
              if (!isAdmin) {
                 delete data.password; // Strip passwords for non-admins
              }
              return { id: doc.id, ...data };
          });
          res.json(users);
        } else {
          const users = await readData("users.json") || [];
          const safeUsers = users.map((user: any) => {
              if (!isAdmin) {
                 const { password, ...safeData } = user;
                 return safeData;
              }
              return user;
          });
          res.json(safeUsers);
        }
    } catch(e) {
        res.status(500).json({error: "Server error"});
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const newUser = req.body;
      if (db) {
        const { id, ...data } = newUser;
        await db.collection("users").doc(id).set(data);
        res.json(newUser);
      } else {
        const users = (await readData("users.json")) || [];
        users.push(newUser);
        await writeData("users.json", users);
        res.json(newUser);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/users/:id", isAuthorizedToModify, async (req, res) => {
    try {
      const id = req.params.id as string;
      const updatedUser = req.body;
      if (db) {
        const { id: _, ...data } = updatedUser;
        await db.collection("users").doc(id).set(data, { merge: true });
        res.json(updatedUser);
      } else {
        let users = (await readData("users.json")) || [];
        // Preserve password if it's missing from the payload when updating (e.g., standard user updating profile)
        users = users.map((u: any) => {
          if (u.id === id) {
             return { ...u, ...updatedUser, password: updatedUser.password || u.password };
          }
          return u;
        });
        await writeData("users.json", users);
        res.json(updatedUser);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/users/:id", isAuthorizedToModify, async (req, res) => {
    try {
      const id = req.params.id as string;
      if (db) {
        await db.collection("users").doc(id).delete();
        res.json({ success: true });
      } else {
        let users = (await readData("users.json")) || [];
        users = users.filter((u: any) => u.id !== id);
        await writeData("users.json", users);
        res.json({ success: true });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/notices", async (req, res) => {
    try {
      if (db) {
        const snapshot = await db.collection("notices").orderBy("date", "desc").get();
        const notices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(notices);
      } else {
        const notices = await readData("notices.json");
        res.json(notices || []);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/notices", async (req, res) => {
    try {
      const newNotice = req.body;
      if (db) {
        const { id, ...data } = newNotice;
        await db.collection("notices").doc(id).set(data);
        res.json(newNotice);
      } else {
        const notices = (await readData("notices.json")) || [];
        notices.unshift(newNotice);
        await writeData("notices.json", notices);
        res.json(newNotice);
      }
    } catch (error) {
      console.error("Error creating notice:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/history", async (req, res) => {
    try {
      if (db) {
        const doc = await db.collection("config").doc("history").get();
        res.json(doc.exists ? doc.data() : null);
      } else {
        const history = await readData("history.json");
        res.json(history);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const history = req.body;
      if (db) {
        await db.collection("config").doc("history").set(history);
        res.json(history);
      } else {
        await writeData("history.json", history);
        res.json(history);
      }
    } catch (error) {
      console.error("Error updating history:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.get("/api/homepage", async (req, res) => {
    try {
      if (db) {
        const doc = await db.collection("config").doc("homepage").get();
        res.json(doc.exists ? doc.data() : null);
      } else {
        const homepage = await readData("homepage.json");
        res.json(homepage);
      }
    } catch (error) {
      console.error("Error fetching homepage:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/homepage", async (req, res) => {
    try {
      const homepage = req.body;
      if (db) {
        await db.collection("config").doc("homepage").set(homepage);
        res.json(homepage);
      } else {
        await writeData("homepage.json", homepage);
        res.json(homepage);
      }
    } catch (error) {
      console.error("Error updating homepage:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/send-welcome-email", async (req, res) => {
    const { email, name } = req.body;
    const config = getEmailConfig();

    if (!config.user || !config.pass) {
        return res.status(500).json({ error: "Email configuration missing" });
    }

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
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/send-approval-email", async (req, res) => {
    const { email, name } = req.body;
    const config = getEmailConfig();

    if (!config.user || !config.pass) {
        return res.status(500).json({ error: "Email configuration missing" });
    }

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
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Serve public directory
  app.use(express.static(path.join(__dirname, "public")));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Changed to custom to handle SPA manually and allow other files
    });
    app.use(vite.middlewares);

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
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));

// Production catch-all for SPA
    app.use((req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
