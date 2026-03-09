import re

with open("services/storage.ts", "r") as f:
    content = f.read()

# Add a helper function to get headers
header_helper = """
const getAuthHeaders = () => {
  const userStr = localStorage.getItem('maz_current_user');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        headers['x-user-id'] = user.id;
      }
    } catch (e) {}
  }
  return headers;
};
"""

content = content.replace("export const storage = {", header_helper + "\nexport const storage = {")

# Update getUsers
content = re.sub(r'getUsers: async \(\): Promise<User\[\]> => {\n    const res = await fetch\(\'/api/users\'\);',
                 "getUsers: async (): Promise<User[]> => {\n    const res = await fetch('/api/users', {\n      headers: getAuthHeaders()\n    });", content)

# Update saveUser (though saveUser is mostly for self-registration, but good practice)
content = re.sub(r'saveUser: async \(user: User\): Promise<User> => {\n    const res = await fetch\(\'/api/users\', {\n      method: \'POST\',\n      headers: \{ \'Content-Type\': \'application/json\' \},',
                 "saveUser: async (user: User): Promise<User> => {\n    const res = await fetch('/api/users', {\n      method: 'POST',\n      headers: getAuthHeaders(),", content)

# Update updateUser
content = re.sub(r'updateUser: async \(updatedUser: User\): Promise<User> => {\n    const res = await fetch\(\`/api/users/\$\{updatedUser.id\}\`, {\n      method: \'PUT\',\n      headers: \{ \'Content-Type\': \'application/json\' \},',
                 "updateUser: async (updatedUser: User): Promise<User> => {\n    const res = await fetch(`/api/users/${updatedUser.id}`, {\n      method: 'PUT',\n      headers: getAuthHeaders(),", content)

# Update deleteUser
content = re.sub(r'deleteUser: async \(userId: string\): Promise<void> => {\n    await fetch\(\`/api/users/\$\{userId\}\`, \{ method: \'DELETE\' \}\);',
                 "deleteUser: async (userId: string): Promise<void> => {\n    await fetch(`/api/users/${userId}`, {\n      method: 'DELETE',\n      headers: getAuthHeaders()\n    });", content)


with open("services/storage.ts", "w") as f:
    f.write(content)
