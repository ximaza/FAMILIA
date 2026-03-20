import re

with open("services/storage.ts", "r") as f:
    content = f.read()

new_methods = """
  updateNotice: async (id: string, updates: Partial<Notice>): Promise<Notice> => {
    const res = await fetch(`/api/notices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  deleteNotice: async (id: string): Promise<void> => {
    const res = await fetch(`/api/notices/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(await res.text());
  },
"""

pattern = re.compile(r'(  addNotice: async \(notice: Notice\): Promise<Notice> => \{.*?\n  \},)', re.MULTILINE | re.DOTALL)
match = pattern.search(content)

if match:
    new_content = content[:match.end()] + "\n" + new_methods + content[match.end():]
    with open("services/storage.ts", "w") as f:
        f.write(new_content)
    print("Patched storage.ts successfully")
else:
    print("Could not find the target block")
