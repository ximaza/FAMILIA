import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";


const defaultHistory = {
  content: "Bienvenido a la historia de la familia Mazarrasa. Utilice el botón de edición para añadir la historia familiar.",
  images: [],
  lastUpdated: new Date().toISOString(),
  updatedBy: "Sistema"
};

const defaultHomepage = {
  welcomeMessage: "Bienvenido/a",
  mainTitle: "AL ENCUENTRO DE LOS MAZARRASA",
  bodyContent: "Espacio reservado para compartir noticias y novedades.",
  imageUrl: "",
  lastUpdated: new Date().toISOString(),
  sections: []
};

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase
let db: admin.firestore.Firestore | null = null;
let bucket: any = null;
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: bucketName
    });
    db = admin.firestore();
    bucket = admin.storage().bucket();

    console.log(`Firebase initialized. Using bucket: ${bucketName}`);
  } else {
    console.warn("Firebase credentials missing. Falling back to local JSON storage.");
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Use JSON middleware with high limit for Base64 (though we prefer Storage)
  app.use(express.json({ limit: '50mb' }));

  const DATA_DIR = path.join(__dirname, "data");

  // Helper for local JSON files
  async function readData(file: string) {
    try {
      const data = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  async function writeData(file: string, data: any) {
    await fs.writeFile(path.join(DATA_DIR, file), JSON.stringify(data, null, 2));
  }

  // Auth helper
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
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

    if (!requestingUserId) {
        return res.status(401).json({ error: "Unauthorized: Missing header" });
    }

    // If targetUserId is present, check ownership
    if (targetUserId && requestingUserId === targetUserId) {
        return next();
    }

    const role = await getUserRole(requestingUserId);

    if (role === 'admin') {
        return next();
    }

    // If no target ID (e.g. upload), only allow if user is at least active
    if (!targetUserId && requestingUserId) {
       if (role === 'admin' || role === 'member') {
          return next();
       }
    }

    return res.status(403).json({ error: "Forbidden: Not authorized" });
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
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    const user = req.body;
    try {
      if (db) {
        await db.collection("users").doc(user.id).set(user);
        res.json(user);
      } else {
        const users = (await readData("users.json")) || [];
        users.push(user);
        await writeData("users.json", users);
        res.json(user);
      }
    } catch (error) {
      console.error("Error saving user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.put("/api/users/:id", isAuthorizedToModify, async (req, res) => {
    const { id } = req.params;
    const updatedUser = req.body;
    try {
      if (db) {
        // Fetch current user to preserve password if not provided
        const doc = await db.collection("users").doc(id).get();
        const currentUser = doc.data();
        const finalUser = {
            ...updatedUser,
            password: updatedUser.password || currentUser?.password
        };
        await db.collection("users").doc(id).set(finalUser);
        res.json(finalUser);
      } else {
        const users = (await readData("users.json")) || [];
        const index = users.findIndex((u: any) => u.id === id);
        if (index !== -1) {
          const finalUser = {
              ...updatedUser,
              password: updatedUser.password || users[index].password
          };
          users[index] = finalUser;
          await writeData("users.json", users);
          res.json(finalUser);
        } else {
          res.status(404).json({ error: "User not found" });
        }
      }
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.delete("/api/users/:id", isAuthorizedToModify, async (req, res) => {
    const { id } = req.params;
    try {
      if (db) {
        await db.collection("users").doc(id).delete();
        res.json({ success: true });
      } else {
        const users = (await readData("users.json")) || [];
        const filteredUsers = users.filter((u: any) => u.id !== id);
        await writeData("users.json", filteredUsers);
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
        res.json(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } else {
        const notices = (await readData("notices.json")) || [];
        res.json(notices.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/notices", async (req, res) => {
    try {
      const notice = req.body;
      const requestingUserId = req.headers['x-user-id'] as string;

      // Enforce security: use the authenticated user ID as author
      if (requestingUserId) {
          notice.authorId = requestingUserId;
      }

      if (db) {
        const docRef = await db.collection("notices").add(notice);
        res.json({ id: docRef.id, ...notice });
      } else {
        const notices = (await readData("notices.json")) || [];
        notices.push(notice);
        await writeData("notices.json", notices);
        res.json(notice);
      }
    } catch (error) {
      console.error("Error saving notice:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Authorization middleware for notices (only author or admin)
  const isAuthorizedForNotice = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestingUserId = req.headers['x-user-id'] as string;
    const noticeId = req.params.id;

    if (!requestingUserId) return res.status(401).json({ error: "Unauthorized" });

    const role = await getUserRole(requestingUserId);
    if (role === 'admin' || role === 'publicador') return next();

    try {
        let notice: any = null;
        if (db) {
            const doc = await db.collection("notices").doc(noticeId).get();
            notice = doc.exists ? doc.data() : null;
        } else {
            const notices = await readData("notices.json");
            notice = notices.find((n: any) => n.id === noticeId);
        }

        if (notice && notice.authorId === requestingUserId) {
            return next();
        }
    } catch (e) {}

    res.status(403).json({ error: "Forbidden: Not author or admin" });
  };

  app.put("/api/notices/:id", isAuthorizedForNotice, async (req, res) => {
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

  app.delete("/api/notices/:id", isAuthorizedForNotice, async (req, res) => {
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


  app.get("/api/history", async (req, res) => {
    try {
      if (db) {
        const doc = await db.collection("config").doc("history").get();
        res.json(doc.exists ? doc.data() : defaultHistory);
      } else {
        const history = await readData("history.json");
        res.json(history || defaultHistory);
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
    } catch (error: any) {
      console.error("Error updating history:", error);
      // Give more specific error message if it's a payload/size error
      const msg = error.message || "Internal Server Error";
      res.status(500).json({ error: msg.includes("request entity too large") ? "El archivo enviado es demasiado grande para el servidor." : msg });
    }
  });

  app.post("/api/upload", isAuthorizedToModify, async (req, res) => {
    try {
      const { image, folder = "images" } = req.body;
      if (!image || !image.startsWith("data:image")) {
        return res.status(400).json({ error: "Invalid image format" });
      }

      if (bucket) {
        // Extract base64 data and mime type
        const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return res.status(400).json({ error: "Invalid base64 string" });
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");

        // Generate unique filename
        const extension = mimeType.split("/")[1] || "webp";
        const filename = `${folder}/${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;

        try {
           const file = bucket.file(filename);
           await file.save(buffer, {
             metadata: { contentType: mimeType },
             public: true
           });
           const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
           res.json({ url: publicUrl });
        } catch (storageError: any) {
           console.error("Storage error, trying fallback bucket:", storageError.message);
           const fallbackBucketName = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
           const fallbackBucket = admin.storage().bucket(fallbackBucketName);
           const file = fallbackBucket.file(filename);
           await file.save(buffer, {
             metadata: { contentType: mimeType },
             public: true
           });
           const publicUrl = `https://storage.googleapis.com/${fallbackBucket.name}/${filename}`;
           res.json({ url: publicUrl });
        }
      } else {
        // Fallback for local dev without firebase: just return the base64 string
        res.json({ url: image });
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ error: error.message || "Failed to upload image" });
    }
  });

  app.get("/api/homepage", async (req, res) => {
    try {
      if (db) {
        const doc = await db.collection("config").doc("homepage").get();
        res.json(doc.exists ? doc.data() : defaultHomepage);
      } else {
        const homepage = await readData("homepage.json");
        res.json(homepage || defaultHomepage);
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
    const config = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS };

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
    const config = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS };

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


  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
        let users = [];
        if (db) {
            const snapshot = await db.collection("users").where('email', '==', email.toLowerCase()).limit(1).get();
            users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            users = (await readData("users.json")) || [];
        }

        const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            // For security, don't reveal if the user exists or not, just return success
            return res.json({ success: true, message: "If the email exists, a new password has been sent." });
        }

        // Flag the user for manual password reset by admin
        if (db) {
            await db.collection("users").doc(user.id).set({ resetRequested: true }, { merge: true });
        } else {
            const updatedUsers = users.map((u: any) => u.id === user.id ? { ...u, resetRequested: true } : u);
            await writeData("users.json", updatedUsers);
        }

        console.log(`Password reset manually requested for ${email}`);
        res.json({ success: true, message: "Solicitud registrada correctamente." });
    } catch (e) {
        console.error("Forgot password error:", e);
        res.status(500).json({ error: "Server error" });
    }
  });

  // Serve static files from the React build
  app.use(express.static(path.join(__dirname, "dist")));

  // Serve the public directory for static assets like admin.html
  app.use(express.static(path.join(__dirname, "public")));

  // Fallback for SPA routing
  app.get(/^\/(?!api\/|direct-admin|admin\.html).*/, (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
