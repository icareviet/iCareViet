import {readFile,writeFile,mkdir,readdir,lstat,copyFile} from 'node:fs/promises';
import {resolve,dirname,join,relative,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
import {deflateRawSync} from 'node:zlib';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z')+'-'+randomBytes(3).toString('hex');
const staging=join(root,'.impeccable','tmp','source-'+stamp,'chua-online');
const output=resolve(root,'dist');
const files=['.gitignore','.gitattributes','README.md','PACKAGING.md','PRODUCT.md','DESIGN.md','package.json','package-lock.json','router.php','storage/.gitkeep','.impeccable/config.json','.impeccable/design.json','.impeccable/gilded-lotus-prompt.txt','.impeccable/temple-direction.md'];
const canonical=path=>path.split(sep).join('/');
async function collect(directory){
  for(const entry of await readdir(join(root,directory),{withFileTypes:true})){
    const path=join(directory,entry.name);if(entry.isSymbolicLink())throw new Error('Refusing linked source: '+path);
    if(entry.isDirectory())await collect(path);else if(entry.isFile())files.push(canonical(path));
  }
}
for(const directory of ['app','public','src','scripts','tests','.impeccable/surfaces'])await collect(directory);
const forbidden=/(^|\/)(node_modules|\.git|\.runtime|\.agents|\.codex|dist|sessions)(\/|$)|(^|\/)\.env($|\.)|\.(sqlite(?:3)?(?:-wal|-shm)?|db|log|zip)$|(^|\/)storage\/(?!\.gitkeep$)|(^|\/)\.impeccable\/(review|tmp|questions)\/|config\.local\.json$|hook\.cache\.json$/i;
const secret=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{30,}\b|\bAKIA[A-Z0-9]{16}\b|\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/;
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const manifest=[];
for(const path of [...new Set(files)].sort()){
  if(forbidden.test(path))throw new Error('Refusing private/runtime file: '+path);
  const source=resolve(root,path),destination=resolve(staging,path);
  for(const [base,candidate]of [[root,source],[staging,destination]]){const rel=relative(base,candidate);if(rel==='..'||rel.startsWith('..'+sep)||resolve(base,rel)!==candidate)throw new Error('Package path escaped its root.');}
  if(!(await lstat(source)).isFile())throw new Error('Required regular source missing: '+path);
  const bytes=await readFile(source);
  if(/\.(php|js|mjs|json|css|md|txt|ps1|yml|yaml)$/i.test(extname(path))&&secret.test(bytes.toString('utf8')))throw new Error('Possible credential in '+path+'; inspect before sharing.');
  await mkdir(dirname(destination),{recursive:true});await copyFile(source,destination);
  manifest.push({path,bytes:bytes.length,sha256:hash(bytes)});
}
const version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const manifestBytes=Buffer.from(JSON.stringify({name:'chua-online',version,generatedAt:new Date().toISOString(),files:manifest},null,2)+'\n');
await writeFile(join(staging,'SOURCE-MANIFEST.json'),manifestBytes);

// Standard ZIP: UTF-8 names, CRC32 and deflate. Verification compares every extracted file with the manifest.
const table=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
const entries=[...manifest.map(file=>file.path),'SOURCE-MANIFEST.json'];
const localParts=[],centralParts=[];let offset=0;
const date=new Date(),year=Math.max(1980,Math.min(2107,date.getUTCFullYear()));
const dosDate=((year-1980)<<9)|((date.getUTCMonth()+1)<<5)|date.getUTCDate(),dosTime=(date.getUTCHours()<<11)|(date.getUTCMinutes()<<5)|Math.floor(date.getUTCSeconds()/2);
for(const path of entries){
  const bytes=await readFile(join(staging,path)),compressed=deflateRawSync(bytes,{level:9}),name=Buffer.from('chua-online/'+path),crc=crc32(bytes);
  const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50,0);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(8,8);local.writeUInt16LE(dosTime,10);local.writeUInt16LE(dosDate,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(bytes.length,22);local.writeUInt16LE(name.length,26);
  localParts.push(local,name,compressed);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt16LE(dosTime,12);central.writeUInt16LE(dosDate,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(compressed.length,20);central.writeUInt32LE(bytes.length,24);central.writeUInt16LE(name.length,28);central.writeUInt32LE(offset,42);centralParts.push(central,name);
  offset+=local.length+name.length+compressed.length;
}
const directory=Buffer.concat(centralParts),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
const zip=Buffer.concat([...localParts,directory,end]);await mkdir(output,{recursive:true});
const filename='chua-online-source-'+stamp+'.zip',archive=join(output,filename),sha256=hash(zip);
await writeFile(archive,zip);await writeFile(archive+'.sha256',sha256+'  '+filename+'\n');
console.log(JSON.stringify({archive,checksumFile:archive+'.sha256',sha256,sourceDirectory:staging,files:entries.length,bytes:zip.length},null,2));
