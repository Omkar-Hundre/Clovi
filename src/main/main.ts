import { app, BrowserWindow, ipcMain, globalShortcut, screen, Tray, Menu, nativeImage, clipboard } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import {
  loadConfig,
  saveConfig,
  setCaptureExclusion,
  applyAlwaysOnTop,
  applyNoActivate,
  applyClickThrough,
  recordForegroundWindow,
  restoreForegroundWindow,
  startForegroundTracker,
  isMouseButtonDown,
  installGlobalMouseHook,
  uninstallGlobalMouseHook
} from './windowsOverlay';
import { captureScreen } from './screenCapture';
import { GeminiService } from './geminiService';
import { OpenAIService } from './openaiService';

const STEALTH_BASE_WIDTH = 210;
const STEALTH_BASE_HEIGHT = 48;
let lastNormalBounds = { width: 440, height: 620, x: 0, y: 0 };

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let geminiService: GeminiService | null = null;
let openaiService: OpenAIService | null = null;
let currentConfig = loadConfig();

let globalDragInterval: NodeJS.Timeout | null = null;
let isGlobalDragging = false;
let dragStartCursor = { x: 0, y: 0 };
let dragStartWindowPos = { x: 0, y: 0 };

let hotCornerInterval: NodeJS.Timeout | null = null;
let hotCornerSolveDwellStart: number | null = null;
let hotCornerSolveTriggered = false;

let hotCornerToggleDwellStart: number | null = null;
let hotCornerToggleTriggered = false;

let hotCornerHideDwellStart: number | null = null;
let hotCornerHideTriggered = false;

let hotCornerMultiSnapDwellStart: number | null = null;
let hotCornerMultiSnapTriggered = false;

let autoWatchInterval: NodeJS.Timeout | null = null;
let clipboardWatcherInterval: NodeJS.Timeout | null = null;
let lastObservedClipboard = '';

export function toggleClickThroughState(explicitState?: boolean) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const targetState = explicitState !== undefined ? explicitState : !currentConfig.clickThrough;
  currentConfig.clickThrough = targetState;
  saveConfig({ clickThrough: currentConfig.clickThrough });
  applyClickThrough(mainWindow, currentConfig.clickThrough);
  mainWindow.webContents.send('overlay:click-through-toggled', currentConfig.clickThrough);
  console.log(`[Main] Click-Through toggled -> ${currentConfig.clickThrough ? 'LOCKED (Pass-Through)' : 'UNLOCKED (Interactive/Draggable)'}`);
}

async function takeCleanScreenshot() {
  return await captureScreen();
}

let isSolving = false;

async function executeSolve(directivePrompt?: string) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (isSolving) {
    console.log('[Main] Solve already in progress, ignoring duplicate trigger.');
    return;
  }
  isSolving = true;

  try {
    recordForegroundWindow();
    const screenshot = await takeCleanScreenshot();
    if (!mainWindow.isVisible()) {
      mainWindow.showInactive();
      applyAlwaysOnTop(mainWindow, true);
      applyNoActivate(mainWindow);
      if (currentConfig.privacyMode) setCaptureExclusion(mainWindow, true);
      if (currentConfig.clickThrough) applyClickThrough(mainWindow, true);
    }

    const finalPrompt = directivePrompt || undefined;

    mainWindow.webContents.send('overlay:global-solve', {
      screenshot,
      customPrompt: finalPrompt
    });
    restoreForegroundWindow();
  } catch (err) {
    console.error('executeSolve failed:', err);
  } finally {
    // Release solve lock after debounce interval
    setTimeout(() => { isSolving = false; }, 1200);
  }
}

function startHandsFreeServices() {
  // Triple Hot Corner Dwell Tracker:
  //   - Bottom-Right (Hold 1s when visible): HIDE Clovi instantly
  //   - Top-Right OR Bottom-Right (Hold 3s when hidden): REAPPEAR Clovi in exact previous state (preserving all answers/UI)
  //   - Top-Right (Hold 3s when visible): Snap Screen & Solve
  //   - Top-Left (Hold 2s): Toggle Interactive / Pass-Through Mode
  if (hotCornerInterval) clearInterval(hotCornerInterval);
  if (currentConfig.hotCornerEnabled !== false) {
    hotCornerInterval = setInterval(() => {
      try {
        const cursor = screen.getCursorScreenPoint();
        const primary = screen.getPrimaryDisplay();
        const bounds = primary.bounds;
        const PADDING = 60; // 60px safe corner zone inside viewport
        const isVisible = mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible();

        // A. Top-Right Corner (Hold 1.5s):
        //    - If Hidden: REAPPEAR in exact previous state (Hold 2s)
        //    - If Visible: Trigger Snap & Solve (Hold 1.5s)
        const inTopRight = cursor.x >= bounds.x + bounds.width - PADDING && cursor.y <= bounds.y + PADDING;
        if (inTopRight) {
          const now = Date.now();
          const dwellRequired = !isVisible ? 2000 : (currentConfig.hotCornerDwellMs || 1500);
          if (hotCornerSolveDwellStart === null) {
            hotCornerSolveDwellStart = now;
          } else if (!hotCornerSolveTriggered && now - hotCornerSolveDwellStart >= dwellRequired) {
            hotCornerSolveTriggered = true;
            if (mainWindow && !mainWindow.isDestroyed()) {
              if (!mainWindow.isVisible()) {
                console.log('[HotCorner] Top-Right 2s dwell -> Reappearing Clovi in exact state');
                mainWindow.showInactive();
                applyAlwaysOnTop(mainWindow, true);
                applyNoActivate(mainWindow);
                if (currentConfig.privacyMode) setCaptureExclusion(mainWindow, true);
                if (currentConfig.clickThrough) applyClickThrough(mainWindow, true);
              } else {
                console.log(`[HotCorner] Top-Right triggered Snap & Solve (${dwellRequired}ms)`);
                mainWindow.webContents.send('overlay:hot-corner-triggered');
                executeSolve();
              }
            }
          }
        } else {
          hotCornerSolveDwellStart = null;
          hotCornerSolveTriggered = false;
        }

        // B. Bottom-Right Corner:
        //    - If Visible: Instant Hide as soon as cursor hovers (0ms)
        //    - If Hidden: Hold 2s -> REAPPEAR Clovi in exact previous state!
        const inBottomRight = cursor.x >= bounds.x + bounds.width - PADDING && cursor.y >= bounds.y + bounds.height - PADDING;
        if (inBottomRight) {
          const now = Date.now();
          const dwellReq = isVisible ? 0 : 2000;
          if (hotCornerHideDwellStart === null) {
            hotCornerHideDwellStart = now;
          }
          if (!hotCornerHideTriggered && (dwellReq === 0 || now - hotCornerHideDwellStart >= dwellReq)) {
            hotCornerHideTriggered = true;
            if (mainWindow && !mainWindow.isDestroyed()) {
              if (isVisible) {
                console.log('[HotCorner] Bottom-Right instant hover -> Hiding Clovi overlay');
                mainWindow.hide();
                restoreForegroundWindow();
              } else {
                console.log('[HotCorner] Bottom-Right 2s dwell -> Reappearing Clovi in exact state');
                mainWindow.showInactive();
                applyAlwaysOnTop(mainWindow, true);
                applyNoActivate(mainWindow);
                if (currentConfig.privacyMode) setCaptureExclusion(mainWindow, true);
                if (currentConfig.clickThrough) applyClickThrough(mainWindow, true);
              }
            }
          }
        } else {
          hotCornerHideDwellStart = null;
          hotCornerHideTriggered = false;
        }

        // C. Top-Left Corner (Hold 2s): Toggle Interactive / Pass-Through Mode
        const inTopLeft = cursor.x <= bounds.x + PADDING && cursor.y <= bounds.y + PADDING;
        if (inTopLeft) {
          const now = Date.now();
          if (hotCornerToggleDwellStart === null) {
            hotCornerToggleDwellStart = now;
          } else if (!hotCornerToggleTriggered && now - hotCornerToggleDwellStart >= 2000) {
            hotCornerToggleTriggered = true;
            console.log('[HotCorner] Top-Left 2s dwell -> Toggling Click-Through / Drag Mode');
            toggleClickThroughState();
          }
        } else {
          hotCornerToggleDwellStart = null;
          hotCornerToggleTriggered = false;
        }

        // D. Bottom-Left Corner (Hold 1.5s): Attach Multi-Screenshot & start 10s Timer
        const inBottomLeft = cursor.x <= bounds.x + PADDING && cursor.y >= bounds.y + bounds.height - PADDING;
        if (inBottomLeft) {
          const now = Date.now();
          if (hotCornerMultiSnapDwellStart === null) {
            hotCornerMultiSnapDwellStart = now;
          } else if (!hotCornerMultiSnapTriggered && now - hotCornerMultiSnapDwellStart >= 1500) {
            hotCornerMultiSnapTriggered = true;
            if (mainWindow && !mainWindow.isDestroyed()) {
              console.log('[HotCorner] Bottom-Left 1.5s dwell -> Capturing multi-screenshot');
              recordForegroundWindow();
              takeCleanScreenshot().then((screenshot) => {
                if (!mainWindow || mainWindow.isDestroyed()) return;
                if (!mainWindow.isVisible()) {
                  mainWindow.showInactive();
                  applyAlwaysOnTop(mainWindow, true);
                  applyNoActivate(mainWindow);
                  if (currentConfig.privacyMode) setCaptureExclusion(mainWindow, true);
                  if (currentConfig.clickThrough) applyClickThrough(mainWindow, true);
                }
                mainWindow.webContents.send('overlay:hot-corner-multi-snap', screenshot);
                restoreForegroundWindow();
              }).catch(err => {
                console.error('[HotCorner] Bottom-Left capture failed:', err);
              });
            }
          }
        } else {
          hotCornerMultiSnapDwellStart = null;
          hotCornerMultiSnapTriggered = false;
        }
      } catch (err) {
        // Ignore cursor track errors
      }
    }, 100);
  }

  // 2. Passive Auto-Watch Interval Solver
  if (autoWatchInterval) clearInterval(autoWatchInterval);
  if (currentConfig.autoWatchEnabled) {
    const sec = Math.max(10, currentConfig.autoWatchIntervalSec || 30);
    autoWatchInterval = setInterval(() => {
      console.log(`[AutoWatch] Triggering periodic solve (${sec}s interval)`);
      executeSolve();
    }, sec * 1000);
  }

  // 3. Clipboard Auto-Solve Watcher
  if (clipboardWatcherInterval) clearInterval(clipboardWatcherInterval);
  if (currentConfig.clipboardAutoSolve) {
    try {
      lastObservedClipboard = clipboard.readText().trim();
    } catch (e) {}

    clipboardWatcherInterval = setInterval(() => {
      try {
        const text = clipboard.readText().trim();
        if (text && text.length > 5 && text !== lastObservedClipboard) {
          lastObservedClipboard = text;
          console.log('[ClipboardWatcher] New copied question detected, auto-solving...');
          executeSolve(`Solve the problem in the screenshot with focus on copied question:\n"${text}"`);
        }
      } catch (e) {}
    }, 800);
  }
}

let isScrollDragging = false;
let scrollDragStartCursor = { x: 0, y: 0 };

function startGlobalDragEngine(win: BrowserWindow) {
  if (globalDragInterval) clearInterval(globalDragInterval);

  globalDragInterval = setInterval(() => {
    if (!win || win.isDestroyed() || !win.isVisible()) return;

    try {
      const isLeftDown = isMouseButtonDown('left');
      const isMiddleDown = isMouseButtonDown('middle');
      const isRightDown = isMouseButtonDown('right');

      const cursor = screen.getCursorScreenPoint();
      const bounds = win.getBounds();

      const isOverEntireWindow =
        cursor.x >= bounds.x &&
        cursor.x <= bounds.x + bounds.width &&
        cursor.y >= bounds.y &&
        cursor.y <= bounds.y + bounds.height;

      // 1. DRAG-TO-SCROLL: Middle-Click (Wheel Button) OR Right-Click dragged anywhere over window
      const isScrollButtonDown = isMiddleDown || isRightDown;
      if (isScrollButtonDown && isOverEntireWindow) {
        if (!isScrollDragging) {
          isScrollDragging = true;
          scrollDragStartCursor = { ...cursor };
        } else {
          const dy = cursor.y - scrollDragStartCursor.y;
          if (dy !== 0) {
            win.webContents.send('overlay:drag-scroll', { deltaY: dy * 2.0 });
            scrollDragStartCursor = { ...cursor };
          }
        }
      } else {
        isScrollDragging = false;
      }

      // 2. WINDOW POSITION DRAG: Left Click on drag handle
      const isStealthDock = bounds.height <= 80;
      const isOverDragHandle = isStealthDock
        ? (cursor.x >= bounds.x && cursor.x <= bounds.x + 35 && cursor.y >= bounds.y && cursor.y <= bounds.y + bounds.height)
        : (cursor.x >= bounds.x && cursor.x <= bounds.x + bounds.width - 150 && cursor.y >= bounds.y && cursor.y <= bounds.y + 45);

      if (isLeftDown && !isScrollDragging) {
        if (!isGlobalDragging) {
          if (isOverDragHandle) {
            isGlobalDragging = true;
            dragStartCursor = { ...cursor };
            dragStartWindowPos = { x: bounds.x, y: bounds.y };
          }
        } else {
          const dx = cursor.x - dragStartCursor.x;
          const dy = cursor.y - dragStartCursor.y;
          win.setPosition(
            Math.round(dragStartWindowPos.x + dx),
            Math.round(dragStartWindowPos.y + dy)
          );
        }
      } else {
        if (isGlobalDragging) {
          isGlobalDragging = false;
          const finalPos = win.getPosition();
          if (isStealthDock) {
            currentConfig.stealthX = finalPos[0];
            currentConfig.stealthY = finalPos[1];
            saveConfig({ stealthX: finalPos[0], stealthY: finalPos[1] });
          } else {
            const currentB = win.getBounds();
            lastNormalBounds = { ...currentB };
            currentConfig.x = finalPos[0];
            currentConfig.y = finalPos[1];
            currentConfig.width = currentB.width;
            currentConfig.height = currentB.height;
            saveConfig({ x: finalPos[0], y: finalPos[1], width: currentB.width, height: currentB.height });
          }
        }
      }
    } catch (e) {
      // Ignore
    }
  }, 16); // 60 FPS smooth dragging & scrolling
}

function createWindow() {
  const config = currentConfig;
  const primaryDisplay = screen.getPrimaryDisplay();
  const workArea = primaryDisplay.workArea;

  const normalWidth = (config.width && config.width >= 240) ? config.width : 400;
  const normalHeight = (config.height && config.height >= 280) ? config.height : 580;
  const normalX = config.x ?? Math.max(workArea.x + 10, workArea.x + workArea.width - normalWidth - 20);
  const normalY = config.y ?? (workArea.y + 40);

  lastNormalBounds = {
    width: normalWidth,
    height: normalHeight,
    x: normalX,
    y: normalY
  };

  // Guarantee initial window coordinates are strictly clamped inside the visible workArea of the primary display!
  const clampX = (x: number, w: number) => Math.max(workArea.x + 10, Math.min(x, workArea.x + workArea.width - w - 10));
  const clampY = (y: number, h: number) => Math.max(workArea.y + 10, Math.min(y, workArea.y + workArea.height - h - 10));

  const initialX = config.stealthX !== undefined
    ? clampX(config.stealthX, STEALTH_BASE_WIDTH)
    : clampX(normalX + normalWidth - STEALTH_BASE_WIDTH, STEALTH_BASE_WIDTH);
  const initialY = config.stealthY !== undefined
    ? clampY(config.stealthY, STEALTH_BASE_HEIGHT)
    : clampY(normalY, STEALTH_BASE_HEIGHT);

  const iconPath = path.join(__dirname, '../../assets/icon.png');
  const appIcon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : undefined;

  mainWindow = new BrowserWindow({
    width: STEALTH_BASE_WIDTH,
    height: STEALTH_BASE_HEIGHT,
    x: initialX,
    y: initialY,
    minWidth: 50,
    minHeight: 40,
    icon: appIcon,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: config.alwaysOnTop,
    skipTaskbar: true, // NEVER show in taskbar
    focusable: false,  // Non-activating overlay: clicking buttons & dragging NEVER steals focus from Chrome/Exam!
    hasShadow: false,  // Disables Windows OS DWM native shadow rectangle/drag outline on screen shares
    thickFrame: false, // Disables OS resizing border frame
    resizable: true,
    movable: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  // Load index.html
  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

  // Configure always on top
  applyAlwaysOnTop(mainWindow, config.alwaysOnTop);

  // Configure initial opacity
  mainWindow.setOpacity(0.95);

  // Set Windows capture exclusion
  if (config.privacyMode) {
    setCaptureExclusion(mainWindow, true);
  }

  // Show window without activating/stealing foreground focus
  mainWindow.once('ready-to-show', () => {
    mainWindow?.showInactive();
    if (mainWindow) {
      applyAlwaysOnTop(mainWindow, config.alwaysOnTop);
      applyNoActivate(mainWindow);
      startForegroundTracker(mainWindow);
      startGlobalDragEngine(mainWindow);

      // Install global low-level mouse interceptor for 100% undetected scrolling and button clicking in transparent mode
      installGlobalMouseHook((type, _rawX, _rawY, delta) => {
        if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) return;

        const cursor = screen.getCursorScreenPoint();
        const bounds = mainWindow.getBounds();
        const isOverWindow =
          cursor.x >= bounds.x &&
          cursor.x <= bounds.x + bounds.width &&
          cursor.y >= bounds.y &&
          cursor.y <= bounds.y + bounds.height;

        if (!isOverWindow) return;

        const relX = Math.round(cursor.x - bounds.x);
        const relY = Math.round(cursor.y - bounds.y);
        const isStealthDock = bounds.height <= 80;

        if (type === 'wheel') {
          // If delta > 0 (scrolled up) -> scroll up (negative deltaY)
          // If delta < 0 (scrolled down) -> scroll down (positive deltaY)
          const scrollDelta = delta ? (delta > 0 ? -60 : 60) : 60;
          mainWindow.webContents.send('overlay:scroll-wheel', {
            deltaY: scrollDelta,
            x: relX,
            y: relY
          });
        } else if (type === 'lbuttondown') {
          if (isStealthDock) {
            // Stealth Pill (Width: 210px, Height: 48px)
            if (relX >= 0 && relX < 35) {
              // Drag handle zone (handled by drag engine)
            } else if (relX >= 35 && relX < 72) {
              // ⚡ Solve
              executeSolve();
            } else if (relX >= 72 && relX < 108) {
              // 🎯 Toggle Pass-Through
              toggleClickThroughState();
            } else if (relX >= 108 && relX < 144) {
              // 📸 Snap Screenshot
              captureScreen().then(data => {
                mainWindow?.webContents.send('overlay:global-snap', data);
              }).catch(() => {});
            } else if (relX >= 144 && relX < 178) {
              // 💬 Directives Prompt Bar
              mainWindow.webContents.send('overlay:toggle-stealth-prompt');
            } else if (relX >= 178 && relX <= 220) {
              // 👻 Expand / Ghost Mode Toggle
              mainWindow.webContents.send('overlay:toggle-ghost-mode');
            } else {
              // Any other element (e.g. response bubble)
              mainWindow.webContents.send('overlay:virtual-click', { x: relX, y: relY });
            }
          } else {
            // Full Window mode top header controls
            if (relY <= 45 && relX >= bounds.width - 150) {
              if (relX >= bounds.width - 35) {
                // Close button
                mainWindow.hide();
              } else if (relX >= bounds.width - 70) {
                // Minimize button
                mainWindow.minimize();
              } else if (relX >= bounds.width - 105) {
                // Settings button ⚙
                mainWindow.webContents.send('overlay:open-settings');
              } else if (relX >= bounds.width - 140) {
                // Docs button 📖
                mainWindow.webContents.send('overlay:open-docs');
              }
            } else {
              mainWindow.webContents.send('overlay:virtual-click', { x: relX, y: relY });
            }
          }
        } else if (type === 'mbuttondown') {
          mainWindow.webContents.send('overlay:virtual-middle-click', {
            x: relX,
            y: relY
          });
        }
      });

      if (config.privacyMode) {
        setCaptureExclusion(mainWindow, true);
      }
      if (config.clickThrough) {
        applyClickThrough(mainWindow, true);
      }
    }
    startHandsFreeServices();
  });

  // When Clovi receives focus, instantly yield active status back to background application (Chrome/Exam)
  mainWindow.on('focus', () => {
    restoreForegroundWindow();
  });

  // Track window position/size changes (only preserve full window dimensions)
  const saveBounds = () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const bounds = mainWindow.getBounds();
    if (bounds.width >= 350 && bounds.height >= 450) {
      lastNormalBounds = { ...bounds };
      saveConfig({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height
      });
    }
  };

  mainWindow.on('resize', saveBounds);
  mainWindow.on('moved', saveBounds);

  // Initialize AI Services (Gemini & OpenAI)
  const apiKey = config.apiKey || '';
  geminiService = new GeminiService(apiKey, config.model || 'gemini-2.5-flash');
  const openaiApiKey = config.openaiApiKey || '';
  openaiService = new OpenAIService(openaiApiKey, config.model || 'gpt-4o');

  // Register Global Shortcuts
  registerGlobalShortcuts();
}

function registerGlobalShortcuts() {
  // 1. Toggle Show/Hide: Ctrl + Shift + Space
  try {
    globalShortcut.register('CommandOrControl+Shift+Space', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      if (mainWindow.isVisible()) {
        mainWindow.hide();
        restoreForegroundWindow();
      } else {
        mainWindow.showInactive();
      }
    });
  } catch (err) {
    console.error('Failed to register shortcut Ctrl+Shift+Space:', err);
  }

  // 2. Instant Screen Capture Hotkeys: Ctrl + Alt + S / F8
  const registerSnapHandler = (accelerator: string) => {
    try {
      globalShortcut.register(accelerator, async () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        try {
          recordForegroundWindow();
          const screenshot = await takeCleanScreenshot();
          if (!mainWindow.isVisible()) {
            mainWindow.showInactive();
          }
          mainWindow.webContents.send('overlay:global-snap', screenshot);
          restoreForegroundWindow();
        } catch (err) {
          console.error(`Global screen capture ${accelerator} failed:`, err);
        }
      });
    } catch (err) {
      console.error(`Failed to register shortcut ${accelerator}:`, err);
    }
  };
  registerSnapHandler('CommandOrControl+Alt+S');
  registerSnapHandler('F8');

  // Helper for Zero-Focus-Loss Hotkey Macro Solvers
  const registerSolveMacro = (accelerator: string, directivePrompt?: string) => {
    try {
      globalShortcut.register(accelerator, async () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        try {
          recordForegroundWindow();
          const screenshot = await takeCleanScreenshot();
          if (!mainWindow.isVisible()) {
            mainWindow.showInactive();
          }

          const finalPrompt = directivePrompt || undefined;

          mainWindow.webContents.send('overlay:global-solve', {
            screenshot,
            customPrompt: finalPrompt
          });
          restoreForegroundWindow();
        } catch (err) {
          console.error(`Global shortcut ${accelerator} failed:`, err);
        }
      });
    } catch (err) {
      console.error(`Failed to register shortcut ${accelerator}:`, err);
    }
  };

  // 3. Instant Snap & Solve: F9 (100% Undetectable by browser key listeners) & Ctrl + Shift + S
  registerSolveMacro('F9');
  registerSolveMacro('CommandOrControl+Shift+S');

  // Macro 1: MCQ Instant Solver (Ctrl + Shift + 1 & Alt + 1)
  const MCQ_PROMPT = 'Identify the correct option (A, B, C, or D) directly. State the chosen option clearly at the very top, followed by a concise 1-2 sentence explanation.';
  registerSolveMacro('CommandOrControl+Shift+1', MCQ_PROMPT);
  registerSolveMacro('Alt+1', MCQ_PROMPT);

  // Macro 2: C Language Solution (Ctrl + Shift + 2 & Alt + 2)
  const C_PROMPT = 'Provide the clean, optimal, and 100% correct C language solution to the problem in the screenshot. Use simple standard C (standard headers <stdio.h>, <stdlib.h>, <string.h>), junior developer style, handling all visible and hidden edge test cases.';
  registerSolveMacro('CommandOrControl+Shift+2', C_PROMPT);
  registerSolveMacro('Alt+2', C_PROMPT);

  // Macro 3: Java & C++ Solution (Ctrl + Shift + 3 & Alt + 3)
  const CPP_PROMPT = 'Provide the optimal, production-ready C++ and Java solution to the problem in the screenshot with time and space complexity.';
  registerSolveMacro('CommandOrControl+Shift+3', CPP_PROMPT);
  registerSolveMacro('Alt+3', CPP_PROMPT);

  // Macro 4: Math / STEM Step-by-Step Derivation (Ctrl + Shift + 4 & Alt + 4)
  const MATH_PROMPT = 'Provide the exact step-by-step mathematical / physics / STEM derivation and clear final numeric or symbolic answer.';
  registerSolveMacro('CommandOrControl+Shift+4', MATH_PROMPT);
  registerSolveMacro('Alt+4', MATH_PROMPT);

  // Macro 5: Bug Finder & Edge Cases (Ctrl + Shift + 5 & Alt + 5)
  const BUG_PROMPT = 'Examine the code in the screenshot, pinpoint the exact bug / logical flaw / edge case failure, and provide the clean corrected code.';
  registerSolveMacro('CommandOrControl+Shift+5', BUG_PROMPT);
  registerSolveMacro('Alt+5', BUG_PROMPT);

  // 4. Ghost / Stealth Mode: Ctrl + Shift + G & F7
  const registerGhostToggle = (accelerator: string) => {
    try {
      globalShortcut.register(accelerator, () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.webContents.send('overlay:toggle-ghost-mode');
      });
    } catch (err) {
      console.error(`Failed to register shortcut ${accelerator}:`, err);
    }
  };
  registerGhostToggle('CommandOrControl+Shift+G');
  registerGhostToggle('F7');

  // 5. Click-Through / Mouse Pass-Through Toggle: F6 & Ctrl + Shift + X
  const registerClickThroughToggle = (accelerator: string) => {
    try {
      globalShortcut.register(accelerator, () => {
        toggleClickThroughState();
      });
    } catch (err) {
      console.error(`Failed to register shortcut ${accelerator}:`, err);
    }
  };
  registerClickThroughToggle('F6');
  registerClickThroughToggle('CommandOrControl+Shift+X');
}

// IPC Handlers
function setupIpcHandlers() {
  // Move window by offset (used for smooth stealth capsule drag)
  ipcMain.handle('overlay:move-window-by', (_, { dx, dy }: { dx: number; dy: number }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const [x, y] = mainWindow.getPosition();
    mainWindow.setPosition(Math.round(x + dx), Math.round(y + dy));
    restoreForegroundWindow();
  });

  // Toggle Focusable state dynamically (allows typing when needed, disables focus to stay 100% undetected)
  ipcMain.handle('overlay:set-focusable', (_, enable: boolean) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.setFocusable(enable);
    if (!enable) {
      restoreForegroundWindow();
    }
  });

  // Toggle Click-Through Mode (Mouse Pass-Through)
  ipcMain.handle('overlay:toggle-click-through', () => {
    toggleClickThroughState();
    return currentConfig.clickThrough;
  });

  // Set Click-Through Mode explicitly
  ipcMain.handle('overlay:set-click-through', (_, enable: boolean) => {
    toggleClickThroughState(enable);
  });

  // Ghost mode window resize/reposition to capsule dock size
  ipcMain.handle('overlay:set-ghost-mode', (_, isGhost: boolean) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;

    if (isGhost) {
      const b = mainWindow.getBounds();
      if (b.height > 150) {
        lastNormalBounds = { ...b };
      }
      const savedSx = currentConfig.stealthX ?? Math.round(b.x + b.width - STEALTH_BASE_WIDTH);
      const savedSy = currentConfig.stealthY ?? Math.round(b.y);
      const clampedSx = Math.max(workArea.x + 4, Math.min(savedSx, workArea.x + workArea.width - STEALTH_BASE_WIDTH - 4));
      const clampedSy = Math.max(workArea.y + 4, Math.min(savedSy, workArea.y + workArea.height - STEALTH_BASE_HEIGHT - 4));

      mainWindow.setBounds({
        x: Math.round(clampedSx),
        y: Math.round(clampedSy),
        width: STEALTH_BASE_WIDTH,
        height: STEALTH_BASE_HEIGHT
      });
      mainWindow.setOpacity(0.95);
    } else {
      // Restore back to full window strictly without expanding or drifting
      const currentBounds = mainWindow.getBounds();
      const targetWidth = (lastNormalBounds.width && lastNormalBounds.width >= 240) ? lastNormalBounds.width : (currentConfig.width || 400);
      const targetHeight = (lastNormalBounds.height && lastNormalBounds.height >= 280) ? lastNormalBounds.height : (currentConfig.height || 580);
      
      let targetX = lastNormalBounds.x ?? (currentBounds.x - targetWidth + currentBounds.width);
      let targetY = lastNormalBounds.y ?? currentBounds.y;

      // Clamp strictly inside workArea
      targetX = Math.max(workArea.x + 10, Math.min(targetX, workArea.x + workArea.width - targetWidth - 10));
      targetY = Math.max(workArea.y + 10, Math.min(targetY, workArea.y + workArea.height - targetHeight - 10));

      mainWindow.setBounds({
        x: Math.round(targetX),
        y: Math.round(targetY),
        width: Math.round(targetWidth),
        height: Math.round(targetHeight)
      });
      mainWindow.setOpacity(currentConfig.opacity || 0.96);
    }
    // Reassert topmost Z-order so stealth mode stays above all opened apps
    applyAlwaysOnTop(mainWindow, true);
    applyNoActivate(mainWindow);
    if (currentConfig.clickThrough) {
      applyClickThrough(mainWindow, true);
    }
    restoreForegroundWindow();
  });

  // Dynamic resize in stealth mode for popups (mini input bar or response bubble)
  ipcMain.handle('overlay:resize-stealth', (_, { width, height }: { width: number; height: number }) => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const current = mainWindow.getBounds();
    const primaryDisplay = screen.getPrimaryDisplay();
    const workArea = primaryDisplay.workArea;

    const w = Math.round(width);
    const h = Math.round(height);

    // Keep right edge aligned so dock doesn't jump horizontally
    let newX = current.x + current.width - w;
    newX = Math.max(workArea.x, Math.min(newX, workArea.x + workArea.width - w));

    // Anchor at current top Y so top is NEVER cut off!
    let newY = current.y;
    // If expanding exceeds bottom screen limit, gently pull up just enough to fit
    if (newY + h > workArea.y + workArea.height) {
      newY = workArea.y + workArea.height - h;
    }
    // Absolute protection against top cutoff
    newY = Math.max(workArea.y + 4, newY);

    mainWindow.setBounds({
      x: Math.round(newX),
      y: Math.round(newY),
      width: w,
      height: h
    });
    applyAlwaysOnTop(mainWindow, true);
    applyNoActivate(mainWindow);
    if (currentConfig.clickThrough) {
      applyClickThrough(mainWindow, true);
    }
    restoreForegroundWindow();
  });

  // Capture screen (clean unblocked capture)
  ipcMain.handle('overlay:capture-screen', async () => {
    return await takeCleanScreenshot();
  });

  // Send prompt to AI Provider (Gemini or OpenAI) with streaming
  ipcMain.handle('overlay:send-prompt', async (_, payload: {
    prompt: string;
    image?: { base64: string; mimeType: string };
    images?: { base64: string; mimeType: string }[];
    history?: any[];
  }) => {
    restoreForegroundWindow();
    const isProviderOpenAI = currentConfig.aiProvider === 'openai';

    if (isProviderOpenAI) {
      if (!currentConfig.openaiApiKey || !currentConfig.openaiApiKey.trim()) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('gemini:stream-error', '🔑 Please enter your OpenAI API key in Settings (⚙) to use ChatGPT.');
        }
        return { ok: false, error: 'OpenAI API key is missing' };
      }
      if (!openaiService) {
        openaiService = new OpenAIService(currentConfig.openaiApiKey, currentConfig.model || 'gpt-4o');
      } else {
        openaiService.updateConfig(currentConfig.openaiApiKey, currentConfig.model);
      }

      try {
        openaiService.askStream(
          payload.prompt,
          payload.images || payload.image,
          payload.history || [],
          {
            onChunk: (chunk: string) => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('gemini:stream-chunk', chunk);
              }
            },
            onDone: (fullText: string) => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('gemini:stream-done', fullText);
              }
            },
            onError: (error: string) => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('gemini:stream-error', error);
              }
            }
          }
        ).catch((err) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('gemini:stream-error', err.message || 'OpenAI API request failed');
          }
        });

        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    } else {
      // Gemini Flow
      if (!currentConfig.apiKey || !currentConfig.apiKey.trim()) {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('gemini:stream-error', '🔑 Please enter your Gemini API key in Settings (⚙) to use Gemini.');
        }
        return { ok: false, error: 'API key is missing' };
      }
      if (!geminiService) {
        geminiService = new GeminiService(currentConfig.apiKey, currentConfig.model || 'gemini-2.5-flash');
      } else {
        geminiService.updateConfig(currentConfig.apiKey, currentConfig.model);
      }

      try {
        geminiService.askStream(
          payload.prompt,
          payload.images || payload.image,
          payload.history || [],
          {
            onChunk: (chunk: string) => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('gemini:stream-chunk', chunk);
              }
            },
            onDone: (fullText: string) => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('gemini:stream-done', fullText);
              }
            },
            onError: (error: string) => {
              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('gemini:stream-error', error);
              }
            }
          }
        ).catch((err) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('gemini:stream-error', err.message || 'Gemini API request failed');
          }
        });

        return { ok: true };
      } catch (err: any) {
        return { ok: false, error: err.message };
      }
    }
  });

  // Toggle Always on top
  ipcMain.handle('overlay:toggle-always-on-top', () => {
    if (!mainWindow) return false;
    const current = mainWindow.isAlwaysOnTop();
    const next = !current;
    applyAlwaysOnTop(mainWindow, next);
    currentConfig.alwaysOnTop = next;
    saveConfig({ alwaysOnTop: next });
    return next;
  });

  // Toggle Privacy Capture Exclusion
  ipcMain.handle('overlay:toggle-privacy', () => {
    if (!mainWindow) return { enabled: false, success: false };
    const next = !currentConfig.privacyMode;
    const res = setCaptureExclusion(mainWindow, next);
    currentConfig.privacyMode = next;
    saveConfig({ privacyMode: next });
    return { enabled: next, success: res.success };
  });

  // Opacity slider
  ipcMain.handle('overlay:set-opacity', (_, opacity: number) => {
    if (!mainWindow) return;
    const clamped = Math.max(0.2, Math.min(1.0, opacity));
    mainWindow.setOpacity(clamped);
    currentConfig.opacity = clamped;
    saveConfig({ opacity: clamped });
  });

  // Get configuration
  ipcMain.handle('overlay:get-config', () => {
    return { ...currentConfig };
  });

  // Update configuration
  ipcMain.handle('overlay:update-config', (_, newConfig: any) => {
    currentConfig = { ...currentConfig, ...newConfig };
    saveConfig(currentConfig);
    if (geminiService && currentConfig.apiKey) {
      geminiService.updateConfig(currentConfig.apiKey, currentConfig.model);
    }
    if (openaiService && currentConfig.openaiApiKey) {
      openaiService.updateConfig(currentConfig.openaiApiKey, currentConfig.model);
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (newConfig.clickThrough !== undefined) {
        applyClickThrough(mainWindow, !!newConfig.clickThrough);
      }
    }
    startHandsFreeServices();
  });

  // Restore focus to previous application window
  ipcMain.handle('overlay:restore-focus', () => {
    restoreForegroundWindow();
  });

  // Window actions
  ipcMain.on('overlay:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('overlay:close', () => {
    mainWindow?.close();
  });
}

function createTray() {
  if (tray) return;

  try {
    const iconPath = path.join(__dirname, '../../assets/icon.png');
    let trayIcon: any;
    if (fs.existsSync(iconPath)) {
      trayIcon = nativeImage.createFromPath(iconPath);
    } else {
      const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZklEQVR4nGNgGAXUBsxgzIqmEUSr84eKMzEwMHAzMDEwiSFLokszMmAB5BvAiK4RZEGqGsDCgA3A+BhGQzYw1A1gZMAOqGIAB4fGkOIBj4cRGs6AwwAGkODiQ5iBG4d1wQ4DAwMA/2AJk1zN65MAAAAASUVORK5CYII=';
      trayIcon = nativeImage.createFromBuffer(Buffer.from(iconBase64, 'base64'));
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('Clovi (Stealth Assistant)');

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Toggle Overlay (Ctrl+Shift+Space)',
        click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          if (mainWindow.isVisible()) {
            mainWindow.hide();
          } else {
            mainWindow.showInactive();
          }
        }
      },
      {
        label: '🎯 Toggle Click-Through (F6)',
        click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          const next = !currentConfig.clickThrough;
          currentConfig.clickThrough = next;
          saveConfig({ clickThrough: next });
          applyClickThrough(mainWindow, next);
          mainWindow.webContents.send('overlay:click-through-toggled', next);
        }
      },
      {
        label: '⚡ Snap & Solve (Ctrl+Shift+S / F9)',
        click: async () => {
          await executeSolve();
        }
      },
      {
        label: '👻 Stealth Mode (Ctrl+Shift+G / F7)',
        click: () => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            if (!mainWindow.isVisible()) mainWindow.showInactive();
            mainWindow.webContents.send('overlay:toggle-ghost-mode');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit Clovi',
        click: () => {
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.showInactive();
      }
    });
  } catch (err) {
    console.warn('Failed to create system tray:', err);
  }
}

// App lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  uninstallGlobalMouseHook();
  if (tray) {
    tray.destroy();
    tray = null;
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
