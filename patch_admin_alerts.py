import re

with open("pages/AdminPanel.tsx", "r") as f:
    content = f.read()

# Update handleAction to catch and alert
handle_action = """
  const handleAction = async (userId: string, action: 'approve' | 'reject') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    try {
        const updatedUser: User = {
            ...user,
            status: action === 'approve' ? 'active' : 'rejected',
            rejectedAt: action === 'reject' ? new Date().toISOString() : user.rejectedAt
        };
        await storage.updateUser(updatedUser);

        // Send approval email if approved
        if (action === 'approve') {
            fetch('/api/send-approval-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    name: user.firstName
                })
            }).catch(err => console.error("Error sending approval email:", err));
        }

        // Refresh local list
        const updatedUsers = await storage.getUsers();
        setUsers(updatedUsers);
    } catch (e: any) {
        alert("Error actualizando usuario: " + e.message);
    }
  };
"""

content = re.sub(r'const handleAction = async \([\s\S]*?setUsers\(updatedUsers\);\n  \};', handle_action.strip(), content)

# Update handleDelete to catch and alert
handle_delete = """
  const handleDelete = async (userId: string, userName: string) => {
      if (userId === currentUser?.id) {
          alert("No puedes eliminar tu propia cuenta mientras estás conectado.");
          return;
      }
      if (window.confirm(`¿Estás seguro de que quieres ELIMINAR definitivamente a ${userName}? Esta acción no se puede deshacer.`)) {
          try {
              await storage.deleteUser(userId);
              const updatedUsers = await storage.getUsers();
              setUsers(updatedUsers);
          } catch (e: any) {
              alert("Error eliminando usuario: " + e.message);
          }
      }
  };
"""

content = re.sub(r'const handleDelete = async \([\s\S]*?\}\n  \};', handle_delete.strip(), content)

with open("pages/AdminPanel.tsx", "w") as f:
    f.write(content)
