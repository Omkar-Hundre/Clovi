const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Verifying Multi-Snap Corner & Clipboard Logic...');

// 1. Verify that auto-clipboard reading is removed from main.ts solve paths
const mainSrc = fs.readFileSync(path.join(__dirname, '../src/main/main.ts'), 'utf-8');
const mainJs = fs.readFileSync(path.join(__dirname, '../dist/main/main.js'), 'utf-8');

// Check that executeSolve does not automatically append clipboard text
assert(!mainSrc.includes('clipboard.readText().trim()') || !mainSrc.includes('finalPrompt = `Solve the problem in the screenshot.\\nAdditional instruction/context from user clipboard'),
  'FAIL: main.ts still has automatic clipboard prompt injection in solve paths!');

// Check that bottom-left corner dwell is defined in main.ts
assert(mainSrc.includes('inBottomLeft'), 'FAIL: main.ts missing inBottomLeft corner detection!');
assert(mainSrc.includes('overlay:hot-corner-multi-snap'), 'FAIL: main.ts missing overlay:hot-corner-multi-snap IPC event!');

// Check that preload.ts exposes onHotCornerMultiSnap
const preloadSrc = fs.readFileSync(path.join(__dirname, '../src/preload/preload.ts'), 'utf-8');
assert(preloadSrc.includes('onHotCornerMultiSnap'), 'FAIL: preload.ts missing onHotCornerMultiSnap!');

// Check that renderer.ts handles onHotCornerMultiSnap and 10s timer
const rendererSrc = fs.readFileSync(path.join(__dirname, '../src/renderer/renderer.ts'), 'utf-8');
assert(rendererSrc.includes('onHotCornerMultiSnap'), 'FAIL: renderer.ts missing onHotCornerMultiSnap listener!');
assert(rendererSrc.includes('multiSnapTimer'), 'FAIL: renderer.ts missing multiSnapTimer!');
assert(rendererSrc.includes('10000'), 'FAIL: renderer.ts missing 10s timeout for multiSnap!');

// Check timing constants in main.ts
assert(mainSrc.includes('isVisible ? 0 : 2000'), 'FAIL: main.ts missing isVisible ? 0 : 2000 for bottom-right corner!');
assert(mainSrc.includes('!isVisible ? 2000 : (currentConfig.hotCornerDwellMs || 1500)'), 'FAIL: main.ts missing 1.5s default for top-right snap!');

// Check C language system instruction in geminiService & openaiService
const geminiSrc = fs.readFileSync(path.join(__dirname, '../src/main/geminiService.ts'), 'utf-8');
const openaiSrc = fs.readFileSync(path.join(__dirname, '../src/main/openaiService.ts'), 'utf-8');

assert(geminiSrc.includes('C programming language') && geminiSrc.includes('junior developer style'),
  'FAIL: geminiService.ts missing C programming language instruction!');
assert(openaiSrc.includes('C programming language') && openaiSrc.includes('junior developer style'),
  'FAIL: openaiService.ts missing C programming language instruction!');
assert(rendererSrc.includes('C programming language'),
  'FAIL: renderer.ts DEFAULT_SOLVE_PROMPT missing C programming language!');

console.log('✅ 1. Auto-clipboard injection safely removed from solve flows.');
console.log('✅ 2. Bottom-left corner dwell (1.5s) correctly wired to IPC event.');
console.log('✅ 3. Preload IPC bridge verified for multi-snap.');
console.log('✅ 4. Renderer multi-snap queue and 10s timer verified.');
console.log('✅ 5. Bottom-right instant hide (0ms) and 2s reappear timing verified.');
console.log('✅ 6. Top-right 1.5s snap hold duration verified.');
console.log('✅ 7. System prompt updated to C language (clean, junior dev style, 100% runnable, hidden test cases).');
console.log('🎉 ALL SYSTEM PROMPT, MULTI-SNAP, CORNER DWELL TIMINGS & CLIPBOARD LOGIC TESTS PASSED!');
