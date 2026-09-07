const fs = require('fs');
const path = require('path');
const asar = require('@electron/asar');

async function buildDist() {
  console.log('🚀 Assembling Clovi Production Release...');

  const rootDir = path.join(__dirname, '..');
  const releaseDir = path.join(rootDir, 'release');
  const winUnpackedDir = path.join(releaseDir, 'win-unpacked');

  if (!fs.existsSync(winUnpackedDir)) {
    fs.mkdirSync(winUnpackedDir, { recursive: true });
  }

  // 1. Copy Electron runtime binaries from node_modules/electron/dist
  const electronDist = path.join(rootDir, 'node_modules/electron/dist');
  console.log('📦 Copying Electron runtime binaries...');
  const files = fs.readdirSync(electronDist);
  for (const file of files) {
    if (file === 'resources') continue; // Handled separately
    const src = path.join(electronDist, file);
    const dest = path.join(winUnpackedDir, file === 'electron.exe' ? 'Clovi.exe' : file);
    try {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.cpSync(src, dest, { recursive: true });
      } else {
        if (!fs.existsSync(dest)) fs.copyFileSync(src, dest);
      }
    } catch (e) {}
  }

  // 2. Prepare app bundle temp folder
  console.log('📦 Bundling app files into app.asar...');
  const tempAppDir = path.join(rootDir, 'build-temp-app');
  if (fs.existsSync(tempAppDir)) {
    fs.rmSync(tempAppDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempAppDir, { recursive: true });

  fs.cpSync(path.join(rootDir, 'dist'), path.join(tempAppDir, 'dist'), { recursive: true });
  fs.cpSync(path.join(rootDir, 'src/renderer'), path.join(tempAppDir, 'src/renderer'), { recursive: true });
  if (fs.existsSync(path.join(rootDir, 'assets'))) {
    fs.cpSync(path.join(rootDir, 'assets'), path.join(tempAppDir, 'assets'), { recursive: true });
  }
  fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(tempAppDir, 'package.json'));

  const targetNodeModules = path.join(tempAppDir, 'node_modules');
  fs.mkdirSync(targetNodeModules, { recursive: true });
  
  // Copy all production dependencies (@google/generative-ai, koffi, bytenode, etc.)
  const prodDeps = ['@google', 'koffi', 'bytenode'];
  for (const dep of prodDeps) {
    const srcDep = path.join(rootDir, 'node_modules', dep);
    if (fs.existsSync(srcDep)) {
      fs.cpSync(srcDep, path.join(targetNodeModules, dep), { recursive: true });
    }
  }

  const resourcesDir = path.join(winUnpackedDir, 'resources');
  if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
  }

  // Pack our app.asar with unpack options for native binaries
  const outAsar = path.join(resourcesDir, 'app.asar');
  await asar.createPackageWithOptions(tempAppDir, outAsar, {
    unpack: '{*.node,*.dll,**/koffi/**}'
  });

  // Also ensure app.asar.unpacked has koffi native binaries
  const unpackedDir = path.join(resourcesDir, 'app.asar.unpacked/node_modules');
  if (!fs.existsSync(unpackedDir)) {
    fs.mkdirSync(unpackedDir, { recursive: true });
  }
  const koffiSrc = path.join(rootDir, 'node_modules/koffi');
  if (fs.existsSync(koffiSrc)) {
    fs.cpSync(koffiSrc, path.join(unpackedDir, 'koffi'), { recursive: true });
  }

  // Clean temp
  fs.rmSync(tempAppDir, { recursive: true, force: true });

  console.log(`✨ Clovi production executable ready!`);
  console.log(`🎯 Executable: ${path.join(winUnpackedDir, 'Clovi.exe')}`);
}

buildDist().catch(console.error);

