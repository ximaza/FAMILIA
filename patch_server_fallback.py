import re

with open("server.ts", "r") as f:
    content = f.read()

# Fix readData to always return array for arrays or object
fixed_readData = """
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
"""
content = re.sub(r'const readData = async \([\s\S]*?return null;\n    \}\n  \};', fixed_readData.strip(), content)

# Fix login route to default to empty array if readData somehow still returns null
content = re.sub(r'users = await readData\("users\.json"\);', 'users = (await readData("users.json")) || [];', content)

with open("server.ts", "w") as f:
    f.write(content)
