import re

with open("pages/Profile.tsx", "r") as f:
    content = f.read()

# Make absolutely sure these variables exist
if "const [newPassword, setNewPassword]" not in content:
    content = content.replace(
        "const [formData, setFormData] = useState<Partial<User>>({});",
        "const [formData, setFormData] = useState<Partial<User>>({});\n  const [newPassword, setNewPassword] = useState('');\n  const [confirmPassword, setConfirmPassword] = useState('');\n  const [passwordError, setPasswordError] = useState('');"
    )

with open("pages/Profile.tsx", "w") as f:
    f.write(content)
print("Profile state fixed.")
