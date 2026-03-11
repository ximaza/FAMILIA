import json

with open("package.json", "r") as f:
    pkg = json.load(f)

# Move typescript to dependencies
if "typescript" in pkg.get("devDependencies", {}):
    ts_version = pkg["devDependencies"]["typescript"]
    del pkg["devDependencies"]["typescript"]
    pkg["dependencies"]["typescript"] = ts_version

with open("package.json", "w") as f:
    json.dump(pkg, f, indent=2)
