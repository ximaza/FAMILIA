import re

with open("context/AuthContext.tsx", "r") as f:
    content = f.read()

login_logic = """
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
        const user = await storage.login(email, password);
        if (user) {
          if (user.status === 'rejected') {
             alert('Su cuenta ha sido rechazada por el administrador.');
             return false;
          }
          if (user.status === 'pending_approval') {
             alert('Su cuenta está pendiente de aprobación por el administrador.');
             return false;
          }
          setCurrentUser(user);
          localStorage.setItem('maz_current_user_id', user.id);
          return true;
        }
        return false;
    } catch(e) {
        return false; // Invalid credentials throw error
    }
  };
"""

content = re.sub(
    r'  const login = async \(email: string, password: string\): Promise<boolean> => \{\n    const user = await storage\.login\(email, password\);\n    if \(user\) \{\n      if \(user\.status === \'rejected\'\) \{\n         alert\(\'Su cuenta ha sido rechazada por el administrador\.\'\);\n         return false;\n      \}\n      if \(user\.status === \'pending_approval\'\) \{\n         alert\(\'Su cuenta está pendiente de aprobación por el administrador\.\'\);\n         return false;\n      \}\n      setCurrentUser\(user\);\n      localStorage\.setItem\(\'maz_current_user_id\', user\.id\);\n      return true;\n    \}\n    return false;\n  \};',
    login_logic.strip(),
    content,
    flags=re.MULTILINE
)

initAuth_logic = """
  useEffect(() => {
    const initAuth = async () => {
      const storedId = localStorage.getItem('maz_current_user_id');
      if (storedId) {
        try {
          const users = await storage.getUsers();
          const user = users.find(u => u.id === storedId);
          // ONLY set user if active or admin
          if (user && (user.status === 'active' || user.role === 'admin')) {
             setCurrentUser(user);
          } else {
             localStorage.removeItem('maz_current_user_id');
          }
        } catch (error) {
          console.error("Error initializing auth:", error);
          localStorage.removeItem('maz_current_user_id');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);
"""

content = re.sub(
    r'  useEffect\(\(\) => \{\n    const initAuth = async \(\) => \{\n      const storedId = localStorage\.getItem\(\'maz_current_user_id\'\);\n      if \(storedId\) \{\n        try \{\n          const users = await storage\.getUsers\(\);\n          const user = users\.find\(u => u\.id === storedId\);\n          if \(user\) setCurrentUser\(user\);\n        \} catch \(error\) \{\n          console\.error\("Error initializing auth:", error\);\n        \}\n      \}\n      setIsLoading\(false\);\n    \};\n    initAuth\(\);\n  \}, \[\]\);',
    initAuth_logic.strip(),
    content,
    flags=re.MULTILINE
)

with open("context/AuthContext.tsx", "w") as f:
    f.write(content)

print("Auth patched")
