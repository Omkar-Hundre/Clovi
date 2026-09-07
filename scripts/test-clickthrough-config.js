const assert = require('assert');

// 1. Test Hot Corner Logic helper
function isPointInCorner(cursor, bounds, zone, padding = 8) {
  if (zone === 'top-right') {
    return cursor.x >= bounds.x + bounds.width - padding && cursor.y <= bounds.y + padding;
  } else if (zone === 'top-left') {
    return cursor.x <= bounds.x + padding && cursor.y <= bounds.y + padding;
  } else if (zone === 'bottom-right') {
    return cursor.x >= bounds.x + bounds.width - padding && cursor.y >= bounds.y + bounds.height - padding;
  } else if (zone === 'bottom-left') {
    return cursor.x <= bounds.x + padding && cursor.y >= bounds.y + bounds.height - padding;
  }
  return false;
}

const bounds = { x: 0, y: 0, width: 1920, height: 1080 };

// Assert Top-Right detection
assert.strictEqual(isPointInCorner({ x: 1918, y: 2 }, bounds, 'top-right'), true, 'Should detect top-right corner');
assert.strictEqual(isPointInCorner({ x: 500, y: 500 }, bounds, 'top-right'), false, 'Should not detect center screen');
assert.strictEqual(isPointInCorner({ x: 1900, y: 500 }, bounds, 'top-right'), false, 'Should not detect right edge center');

// Assert Top-Left detection
assert.strictEqual(isPointInCorner({ x: 2, y: 3 }, bounds, 'top-left'), true, 'Should detect top-left corner');
assert.strictEqual(isPointInCorner({ x: 1918, y: 2 }, bounds, 'top-left'), false, 'Should not detect top-right as top-left');

// 2. Test WS_EX_TRANSPARENT flag math
const WS_EX_TRANSPARENT = 0x00000020;
const WS_EX_NOACTIVATE = 0x08000000;
const baseEx = BigInt(WS_EX_NOACTIVATE);

const enabledEx = baseEx | BigInt(WS_EX_TRANSPARENT);
assert.strictEqual(Boolean(enabledEx & BigInt(WS_EX_TRANSPARENT)), true, 'WS_EX_TRANSPARENT should be active');

const disabledEx = enabledEx & ~BigInt(WS_EX_TRANSPARENT);
assert.strictEqual(Boolean(disabledEx & BigInt(WS_EX_TRANSPARENT)), false, 'WS_EX_TRANSPARENT should be removed');

console.log('✅ All Hands-Free & Click-Through logic self-checks passed successfully!');
