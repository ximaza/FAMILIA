import re

with open('pages/Login.tsx', 'r') as f:
    content = f.read()

content = content.replace('''<<<<<<< HEAD
    parentsNames: '',
=======
    fatherName: '',
    motherName: '',
>>>>>>> 09650f4 (Merge pull request #28 from ximaza/jules-16508749095822101027-23cd88f9)''', '''    fatherName: '',
    motherName: '',''')

content = content.replace('''<<<<<<< HEAD
        parentsNames: formData.parentsNames,
=======
        fatherName: formData.fatherName,
        motherName: formData.motherName,
>>>>>>> 09650f4 (Merge pull request #28 from ximaza/jules-16508749095822101027-23cd88f9)''', '''        fatherName: formData.fatherName,
        motherName: formData.motherName,''')

content = content.replace('''<<<<<<< HEAD
        alert('Hola, tu registro se ha enviado y está pendiente de validación por administración. En breve podrás acceder a todo el contenido.');
        setIsRegistering(false);
<<<<<<< HEAD
        setFormData({ firstName: '', surname1: '', surname2: '', surname3: '', surname4: '', birthDate: '', parentsNames: '', email: '', password: '' });
    } catch (e: unknown) {
        alert('Hubo un error al procesar el registro: ' + (e instanceof Error ? e.message : String(e)));
=======
=======''', '')

content = content.replace('''        // Replaced alert with success state update
        setIsRegisterSuccess(true);
>>>>>>> 9b26924 (fix: change registration success to show UI message instead of alert)
        setFormData({ firstName: '', surname1: '', surname2: '', surname3: '', surname4: '', birthDate: '', fatherName: '',
    motherName: '', email: '', password: '' });
    } catch (e: any) {
        alert('Hubo un error al procesar el registro: ' + e.message);''', '''        setIsRegisterSuccess(true);
        setFormData({ firstName: '', surname1: '', surname2: '', surname3: '', surname4: '', birthDate: '', fatherName: '', motherName: '', email: '', password: '' });
    } catch (e: unknown) {
        alert('Hubo un error al procesar el registro: ' + (e instanceof Error ? e.message : String(e)));''')

content = content.replace('''<<<<<<< HEAD
                    <label className="text-xs font-bold text-slate-500 uppercase">Nombre de los Padres</label>
                    <input
                        required
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-family-500 outline-none"
                        placeholder="Padre y Madre..."
                        value={formData.parentsNames}
                        onChange={e => setFormData({...formData, parentsNames: e.target.value})}
=======''', '')

with open('pages/Login.tsx', 'w') as f:
    f.write(content)
