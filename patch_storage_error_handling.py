import re

with open("services/storage.ts", "r") as f:
    content = f.read()

def inject_error_check(match):
    fetch_call = match.group(1)
    return f"{fetch_call}\n    if (!res.ok) throw new Error(await res.text());"

content = re.sub(r'(const res = await fetch\([\s\S]*?\);)', inject_error_check, content)

with open("services/storage.ts", "w") as f:
    f.write(content)
