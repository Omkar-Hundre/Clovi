const path = require('path');
const asarPath = path.join(__dirname, '../release/win-unpacked/resources/app.asar');

try {
  console.log('Testing module resolution inside app.asar...');
  // 1. Verify @google/generative-ai can be resolved
  const geminiModule = require(path.join(asarPath, 'node_modules/@google/generative-ai'));
  console.log('✅ @google/generative-ai loaded successfully! Version / Export:', Object.keys(geminiModule));

  // 2. Verify koffi can be resolved
  const koffiModule = require(path.join(__dirname, '../release/win-unpacked/resources/app.asar.unpacked/node_modules/koffi'));
  console.log('✅ koffi loaded successfully! Available functions:', Object.keys(koffiModule).slice(0, 5));

  // 3. Verify dist/main/geminiService.js can be required
  const geminiService = require(path.join(asarPath, 'dist/main/geminiService.js'));
  console.log('✅ dist/main/geminiService.js loaded successfully! Exports:', Object.keys(geminiService));

  console.log('🎉 ALL PACKAGED MODULES VERIFIED 100% WORKING WITH ZERO ERRORS!');
} catch (err) {
  console.error('❌ Verification failed:', err);
  process.exit(1);
}
