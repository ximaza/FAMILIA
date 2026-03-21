import json

with open("package.json", "r") as f:
    pkg = json.load(f)

pkg["scripts"]["dev"] = "tsx server.ts"

with open("package.json", "w") as f:
    json.dump(pkg, f, indent=2)
