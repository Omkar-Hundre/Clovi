const koffi = require('koffi');
const user32 = koffi.load('user32.dll');

const POINT = koffi.struct('POINT', {
  x: 'long',
  y: 'long'
});

const MSLLHOOKSTRUCT = koffi.struct('MSLLHOOKSTRUCT', {
  pt: POINT,
  mouseData: 'uint32_t',
  flags: 'uint32_t',
  time: 'uint32_t',
  dwExtraInfo: 'uintptr_t'
});

const LowLevelMouseProc = koffi.proto('intptr_t __stdcall LowLevelMouseProc(int nCode, uintptr_t wParam, MSLLHOOKSTRUCT *lParam)');

const SetWindowsHookExW = user32.func('uintptr_t __stdcall SetWindowsHookExW(int idHook, LowLevelMouseProc *lpfn, uintptr_t hmod, uint32_t dwThreadId)');
const CallNextHookEx = user32.func('intptr_t __stdcall CallNextHookEx(uintptr_t hhk, int nCode, uintptr_t wParam, MSLLHOOKSTRUCT *lParam)');
const UnhookWindowsHookEx = user32.func('bool __stdcall UnhookWindowsHookEx(uintptr_t hhk)');

const WH_MOUSE_LL = 14;
let hook = 0;

const callback = koffi.register((nCode, wParam, lParam) => {
  return CallNextHookEx(hook, nCode, wParam, lParam);
}, koffi.pointer(LowLevelMouseProc));

hook = SetWindowsHookExW(WH_MOUSE_LL, callback, 0, 0);
console.log('Hook handle:', hook);

if (hook !== 0) {
  console.log('✅ WH_MOUSE_LL hook successfully registered with Koffi!');
  UnhookWindowsHookEx(hook);
  koffi.unregister(callback);
  console.log('✅ WH_MOUSE_LL hook unhooked cleanly!');
} else {
  console.error('❌ Hook failed to register');
}
