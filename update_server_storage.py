import sys

with open('server.ts', 'r') as f:
    content = f.read()

# Improve Firebase Storage Initialization
old_init = """    db = admin.firestore();
    bucket = admin.storage().bucket(`${process.env.FIREBASE_PROJECT_ID}.appspot.com`);
    console.log("Firebase initialized successfully");"""

new_init = """    db = admin.firestore();
    // Support both old and new bucket formats
    const bucketName = `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
    const fallbackBucketName = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;

    bucket = admin.storage().bucket(bucketName);

    // We can't easily check if bucket exists here without a network call,
    // so we'll just log both and hope for the best, or handle it in the upload route.
    console.log(`Firebase initialized. Using bucket: ${bucketName}`);"""

content = content.replace(old_init, new_init)

# Improve Upload Route with better logging and fallback
old_upload = """  app.post("/api/upload", isAuthorizedToModify, async (req, res) => {
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

        const file = bucket.file(filename);

        await file.save(buffer, {
          metadata: { contentType: mimeType },
          public: true
        });

        // Get public URL using the proper format for Firebase Storage
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
        res.json({ url: publicUrl });
      } else {"""

new_upload = """  app.post("/api/upload", isAuthorizedToModify, async (req, res) => {
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
      } else {"""

content = content.replace(old_upload, new_upload)

with open('server.ts', 'w') as f:
    f.write(content)
