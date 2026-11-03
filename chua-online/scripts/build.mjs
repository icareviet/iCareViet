import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('public/assets', { recursive: true });
await build({ entryPoints: ['src/app.js'], bundle: true, minify: true, sourcemap: false, outdir: 'public/assets', target: 'es2022', legalComments: 'eof' });
await copyFile('src/styles.css', 'public/assets/styles.css');
await mkdir('public/assets/fonts', { recursive: true });
for (const [family, weights] of [['be-vietnam-pro', [400,600]], ['noto-serif',[500]]]) {
  for (const weight of weights) for (const subset of ['latin','vietnamese']) {
    const file = `${family}-${subset}-${weight}-normal.woff2`;
    await copyFile(`node_modules/@fontsource/${family}/files/${file}`, `public/assets/fonts/${file}`);
  }
}
await mkdir('public/assets/licenses', { recursive: true });
for (const [packageName, name] of [['three','three'],['lucide','lucide'],['@fontsource/be-vietnam-pro','be-vietnam-pro'],['@fontsource/noto-serif','noto-serif']]) {
  await copyFile(`node_modules/${packageName}/LICENSE`, `public/assets/licenses/${name}.txt`);
}
console.log('Built public/assets.');
