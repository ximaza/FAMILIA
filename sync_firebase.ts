import admin from 'firebase-admin';
import fs from 'fs';

async function sync() {
  const sourceCreds = JSON.parse(fs.readFileSync('./main-key.json', 'utf8'));
  const destCreds = JSON.parse(fs.readFileSync('./dev-key.json', 'utf8'));

  const sourceApp = admin.initializeApp({ credential: admin.credential.cert(sourceCreds) }, 'source');
  const destApp = admin.initializeApp({ credential: admin.credential.cert(destCreds) }, 'dest');

  const sourceBucket = sourceApp.storage().bucket(`${sourceCreds.project_id}.appspot.com`);
  const destBucket = destApp.storage().bucket(`${destCreds.project_id}.appspot.com`);

  console.log(`Source project: ${sourceCreds.project_id}`);
  console.log(`Dest project: ${destCreds.project_id}`);

  const collections = ['users', 'notices', 'config'];
  for (const col of collections) {
    console.log(`Copiando ${col}...`);
    const snap = await sourceApp.firestore().collection(col).get();
    for (const doc of snap.docs) {
      let data = doc.data();
      const dataStr = JSON.stringify(data).replace(new RegExp(sourceBucket.name, 'g'), destBucket.name);
      await destApp.firestore().collection(col).doc(doc.id).set(JSON.parse(dataStr));
    }
    console.log(`✓ ${snap.size} docs en ${col}`);
  }

  console.log('Copiando archivos...');
  try {
    const [files] = await sourceBucket.getFiles();
    for (const file of files) {
      console.log(`Clonando ${file.name}`);
      const [content] = await file.download();
      await destBucket.file(file.name).save(content, {
        metadata: { contentType: file.metadata.contentType },
        public: true
      });
    }
    console.log(`✓ ${files.length} archivos clonados`);
  } catch (e: any) {
    console.log(`Aviso: No se pudieron copiar archivos (${e.message}). Comprueba si el bucket existe.`);
  }

  await sourceApp.delete();
  await destApp.delete();
}

sync().catch(console.error);
