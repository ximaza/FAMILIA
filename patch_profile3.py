import re

with open("pages/Profile.tsx", "r") as f:
    content = f.read()

content = content.replace("password: passToUpdate\n        photoUrl", "password: passToUpdate,\n        photoUrl")

with open("pages/Profile.tsx", "w") as f:
    f.write(content)
