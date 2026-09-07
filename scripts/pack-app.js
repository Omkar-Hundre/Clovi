const asar = require('@electron/asar');
const fs = require('fs');
const path = require('path');

async function pack() {
  console.log('📦 Packaging Clovi app.asar bundle...');

  const rootDir = path.join(__dirname, '..');
  const tempAppDir = path.join(rootDir, 'build-temp-app');
  
  if (fs.existsSync(tempAppDir)) {
    fs.rmSync(tempAppDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempAppDir, { recursive: true });

  // Copy dist
  fs.cpSync(path.join(rootDir, 'dist'), path.join(tempAppDir, 'dist'), { recursive: true });
  // Copy src/renderer
  fs.cpSync(path.join(rootDir, 'src/renderer'), path.join(tempAppDir, 'src/renderer'), { recursive: true });
  // Copy package.json
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(tempAppDir, 'package.json'));

  // Copy node_modules (production deps: koffi, @google/generative-ai, bytenode, etc.)
  const targetNodeModules = path.join(tempAppDir, 'node_modules');
  fs.mkdirSync(targetNodeModules, { recursive: true });
  const prodDeps = ['koffi', '@google', 'bytenode'];
  for (const dep of prodDeps) {
    const srcDep = path.join(rootDir, 'node_modules', dep);
    if (fs.existsSync(srcDep)) {
      fs.cpSync(srcDep, path.join(targetNodeModules, dep), { recursive: true });
    }
  }

  const outAsar = path.join(rootDir, 'release/win-unpacked/resources/app.asar');
  await asar.createPackage(tempAppDir, outAsar);
  console.log(`✅ app.asar created successfully at: ${outAsar}`);

  // Clean temp
  fs.rmSync(tempAppDir, { recursive: true, force: true });
}

pack().catch(console.error);
