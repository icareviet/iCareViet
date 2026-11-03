// Decode once at build time: the application does not need workers or relaxed CSP.
import {NodeIO} from '@gltf-transform/core';
import {KHRDracoMeshCompression} from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
const io = new NodeIO().registerExtensions([KHRDracoMeshCompression]).registerDependencies({
  'draco3d.decoder': await draco.createDecoderModule(),
});
const path = 'public/assets/models/kamakura-buddha.glb';
const document = await io.read(path);
for (const extension of document.getRoot().listExtensionsUsed()) extension.dispose();
document.getRoot().setExtras({source:'https://zenodo.org/records/20207851',creator:'Scan-the-World',license:'CC-BY-NC-SA-4.0',changes:'Draco decoded for CSP-compatible local loading; gold material applied by application.'});
await io.write(path, document);
console.log('Prepared locally served Buddha model.');
