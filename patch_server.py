import re

with open("server.ts", "r") as f:
    content = f.read()

# Add logging to isAuthorizedToModify
logged_auth = """
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
"""

content = re.sub(r'const isAuthorizedToModify = async \([\s\S]*?return res\.status\(403\)\.json\(\{ error: "Forbidden" \}\);\n  \};', logged_auth.strip(), content)

with open("server.ts", "w") as f:
    f.write(content)
