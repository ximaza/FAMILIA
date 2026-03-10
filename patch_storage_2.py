import re

with open("services/storage.ts", "r") as f:
    content = f.read()

correct_helper = """
const getAuthHeaders = () => {
  const userId = localStorage.getItem('maz_current_user_id');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
};
"""

content = re.sub(r'const getAuthHeaders = \(\) => \{[\s\S]*?return headers;\n\};', correct_helper.strip(), content)

with open("services/storage.ts", "w") as f:
    f.write(content)
