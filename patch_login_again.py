import re

with open("pages/Login.tsx", "r") as f:
    content = f.read()

# Let's completely rework handleRegister and handleLogin to be robust.
register_logic = """
    try {
        await register(newUser);

        // Send welcome email
        try {
            await fetch('/api/send-welcome-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newUser.email, name: newUser.firstName })
            });
        } catch (error) {
            console.error("Email NO enviado:", error);
        }

        // Wait a small tick so React completes state batching safely
        setTimeout(() => {
            alert('Registro completado. Su cuenta está pendiente de aprobación por un administrador.');
            setIsRegistering(false);
            setFormData({ firstName: '', surname1: '', surname2: '', surname3: '', surname4: '', birthDate: '', parentsNames: '', email: '', password: '' });
        }, 100);

    } catch (e: any) {
        alert('Error en el registro: ' + (e.message || "Usuario ya existe o error de conexión"));
    }
"""

content = re.sub(
    r'    try \{\n        await register\(newUser\);\n        \n        // Send welcome email\n        try \{\n            await fetch\(\'/api/send-welcome-email\', \{\n                method: \'POST\',\n                headers: \{ \'Content-Type\': \'application/json\' \},\n                body: JSON.stringify\(\{ \n                    email: newUser.email, \n                    name: newUser.firstName \n                \}\)\n            \}\);\n        \} catch \(error\) \{\n            console.error\("Error calling email API:", error\);\n        \}\n\n        alert\(\'Registro completado. Su cuenta está pendiente de aprobación por un administrador.\'\);\n        setIsRegistering\(false\);\n        setFormData\(\{ firstName: \'\', surname1: \'\', surname2: \'\', surname3: \'\', surname4: \'\', birthDate: \'\', parentsNames: \'\', email: \'\', password: \'\' \}\);\n    \} catch \(e: any\) \{\n        alert\(\'Hubo un error al procesar el registro: \' \+ e.message\);\n    \}',
    register_logic.strip(),
    content,
    flags=re.MULTILINE
)

with open("pages/Login.tsx", "w") as f:
    f.write(content)

print("Patched Login.tsx")
