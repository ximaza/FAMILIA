import sys

with open('server.ts', 'r') as f:
    content = f.read()

# Fix isAuthorizedToModify to allow global actions when no target ID is present
old_middleware = """  const isAuthorizedToModify = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
  };"""

new_middleware = """  const isAuthorizedToModify = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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
  };"""

if old_middleware.strip() in content:
    new_content = content.replace(old_middleware.strip(), new_middleware.strip())
    with open('server.ts', 'w') as f:
        f.write(new_content)
    print("Updated isAuthorizedToModify")
else:
    # Try with a less strict search
    if "const isAuthorizedToModify = async" in content:
         import re
         pattern = re.compile(r'  const isAuthorizedToModify = async \(req: express\.Request, res: express\.Response, next: express\.NextFunction\) => \{.*?  \};', re.DOTALL)
         new_content = pattern.sub(new_middleware.strip(), content)
         with open('server.ts', 'w') as f:
             f.write(new_content)
         print("Updated isAuthorizedToModify via Regex")
    else:
         print("Could not find old_middleware")
