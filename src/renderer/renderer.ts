export {};

declare global {
  interface Window {
    electronAPI: any;
  }
}

interface AttachedImage {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

interface ChatMsg {
  role: 'user' | 'model';
  text: string;
  imageBase64?: string;
  imageMimeType?: string;
  images?: { base64: string; mimeType: string }[];
}

// DOM Elements
const chatContainer = document.getElementById('chatContainer') as HTMLElement;
const welcomeBox = document.getElementById('welcomeBox') as HTMLElement;
const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement;
const btnSend = document.getElementById('btnSend') as HTMLButtonElement;
const btnSnapScreen = document.getElementById('btnSnapScreen') as HTMLButtonElement;
const btnAutoSolve = document.getElementById('btnAutoSolve') as HTMLButtonElement;
const btnPasteClipboard = document.getElementById('btnPasteClipboard') as HTMLButtonElement;
const btnClearChat = document.getElementById('btnClearChat') as HTMLButtonElement;

// Multi-Attachment Preview Elements
const attachmentPreview = document.getElementById('attachmentPreview') as HTMLElement;
const attachmentLabel = document.getElementById('attachmentLabel') as HTMLElement;
const thumbList = document.getElementById('thumbList') as HTMLElement;
const btnClearAllAttachments = document.getElementById('btnClearAllAttachments') as HTMLButtonElement;

// Overlay Container & Ghost / Stealth Elements
const overlayContainer = document.getElementById('overlayContainer') as HTMLElement;
const btnStealthToolbar = document.getElementById('btnStealthToolbar') as HTMLButtonElement;
const ghostBubble = document.getElementById('ghostBubble') as HTMLElement;

// Stealth Suite DOM Elements
const stealthContainer = document.getElementById('stealthContainer') as HTMLElement;
const stealthDock = document.getElementById('stealthDock') as HTMLElement;
const stealthDragHandle = document.getElementById('stealthDragHandle') as HTMLElement;
const btnStealthSolve = document.getElementById('btnStealthSolve') as HTMLButtonElement;
const stealthSolveIcon = document.getElementById('stealthSolveIcon') as HTMLElement;
const stealthSolveSpinner = document.getElementById('stealthSolveSpinner') as HTMLElement;
const btnStealthClickThrough = document.getElementById('btnStealthClickThrough') as HTMLButtonElement;
const stealthClickThroughIcon = document.getElementById('stealthClickThroughIcon') as HTMLElement;
const btnStealthSnap = document.getElementById('btnStealthSnap') as HTMLButtonElement;
const stealthSnapBadge = document.getElementById('stealthSnapBadge') as HTMLElement;
const btnStealthPrompt = document.getElementById('btnStealthPrompt') as HTMLButtonElement;
const btnStealthExpand = document.getElementById('btnStealthExpand') as HTMLButtonElement;
const stealthInputBar = document.getElementById('stealthInputBar') as HTMLElement;
const stealthInputText = document.getElementById('stealthInputText') as HTMLTextAreaElement;
const btnStealthSend = document.getElementById('btnStealthSend') as HTMLButtonElement;
const stealthResponseBubble = document.getElementById('stealthResponseBubble') as HTMLElement;
const stealthResponseContent = document.getElementById('stealthResponseContent') as HTMLElement;
const btnStealthScrollUp = document.getElementById('btnStealthScrollUp') as HTMLButtonElement;
const btnStealthScrollDown = document.getElementById('btnStealthScrollDown') as HTMLButtonElement;

// Quick Toolbar & Toast DOM Elements
const btnClickThroughToolbar = document.getElementById('btnClickThroughToolbar') as HTMLButtonElement;
const btnClickThroughText = document.getElementById('btnClickThroughText') as HTMLElement;
const handsFreeToast = document.getElementById('handsFreeToast') as HTMLElement;
const handsFreeToastText = document.getElementById('handsFreeToastText') as HTMLElement;
const toastIcon = document.getElementById('toastIcon') as HTMLElement;

// Window Controls
const btnDocs = document.getElementById('btnDocs') as HTMLButtonElement;
const btnSettings = document.getElementById('btnSettings') as HTMLButtonElement;
const btnMinimize = document.getElementById('btnMinimize') as HTMLButtonElement;
const btnClose = document.getElementById('btnClose') as HTMLButtonElement;

// Settings Modal
const settingsModal = document.getElementById('settingsModal') as HTMLElement;
const modalBackdrop = document.getElementById('modalBackdrop') as HTMLElement;
const btnCloseSettings = document.getElementById('btnCloseSettings') as HTMLButtonElement;
const btnSaveSettings = document.getElementById('btnSaveSettings') as HTMLButtonElement;
const selectAiProvider = document.getElementById('selectAiProvider') as HTMLSelectElement;
const groupGeminiKey = document.getElementById('groupGeminiKey') as HTMLElement;
const groupOpenaiKey = document.getElementById('groupOpenaiKey') as HTMLElement;
const inputApiKey = document.getElementById('inputApiKey') as HTMLInputElement;
const inputOpenaiApiKey = document.getElementById('inputOpenaiApiKey') as HTMLInputElement;
const selectModel = document.getElementById('selectModel') as HTMLSelectElement;
const rangeOpacity = document.getElementById('rangeOpacity') as HTMLInputElement;
const opacityVal = document.getElementById('opacityVal') as HTMLElement;
const chkAlwaysOnTop = document.getElementById('chkAlwaysOnTop') as HTMLInputElement;
const chkPrivacyMode = document.getElementById('chkPrivacyMode') as HTMLInputElement;

function updateAiModelOptions(provider: 'gemini' | 'openai' = 'gemini', selectedModel?: string) {
  if (groupGeminiKey && groupOpenaiKey) {
    if (provider === 'openai') {
      groupGeminiKey.style.display = 'none';
      groupOpenaiKey.style.display = 'flex';
    } else {
      groupGeminiKey.style.display = 'flex';
      groupOpenaiKey.style.display = 'none';
    }
  }

  if (selectModel) {
    selectModel.innerHTML = '';
    if (provider === 'openai') {
      const models = [
        { value: 'gpt-4o', label: 'GPT-4o (Flagship Omni Multimodal Vision)' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Ultra Fast & Cost-Efficient)' },
        { value: 'o3-mini', label: 'o3-mini (Advanced STEM & Coding Reasoning)' },
        { value: 'o1', label: 'o1 (Deep Scientific & Logic Reasoning)' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Vision & Code)' }
      ];
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.innerText = m.label;
        if (selectedModel && selectedModel === m.value) opt.selected = true;
        selectModel.appendChild(opt);
      });
    } else {
      const models = [
        { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Ultra Fast & Multimodal)' },
        { value: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash (High Performance)' },
        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Advanced Reasoning)' },
        { value: 'gemini-flash-latest', label: 'Gemini Flash Latest' }
      ];
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.value;
        opt.innerText = m.label;
        if (selectedModel && selectedModel === m.value) opt.selected = true;
        selectModel.appendChild(opt);
      });
    }
  }
}

// Theme Customization Elements
const selectPillTheme = document.getElementById('selectPillTheme') as HTMLSelectElement;
const rangePillOpacity = document.getElementById('rangePillOpacity') as HTMLInputElement;
const pillOpacityVal = document.getElementById('pillOpacityVal') as HTMLElement;
const inputCustomPillColor = document.getElementById('inputCustomPillColor') as HTMLInputElement;

// Hands-Free Settings DOM Elements
const chkClickThrough = document.getElementById('chkClickThrough') as HTMLInputElement;
const chkHotCorner = document.getElementById('chkHotCorner') as HTMLInputElement;
const selectHotCornerZone = document.getElementById('selectHotCornerZone') as HTMLSelectElement;
const selectHotCornerDwell = document.getElementById('selectHotCornerDwell') as HTMLSelectElement;
const hotCornerControls = document.getElementById('hotCornerControls') as HTMLElement;
const chkAutoWatch = document.getElementById('chkAutoWatch') as HTMLInputElement;
const selectAutoWatchInterval = document.getElementById('selectAutoWatchInterval') as HTMLSelectElement;
const autoWatchControls = document.getElementById('autoWatchControls') as HTMLElement;
const chkClipboardSolve = document.getElementById('chkClipboardSolve') as HTMLInputElement;

// Docs Modal
const docsModal = document.getElementById('docsModal') as HTMLElement;
const docsBackdrop = document.getElementById('docsBackdrop') as HTMLElement;
const btnCloseDocs = document.getElementById('btnCloseDocs') as HTMLButtonElement;
const btnDoneDocs = document.getElementById('btnDoneDocs') as HTMLButtonElement;

// State
let attachedImages: AttachedImage[] = [];
const MAX_ATTACHMENTS = 5;
let chatHistory: ChatMsg[] = [];
let currentStreamingBubble: HTMLElement | null = null;
let currentStreamingText = '';
let isGenerating = false;
let isGhostMode = true;
let isClickThrough = false;
let toastTimeout: any = null;

let currentPillTheme: 'dark' | 'light' | 'slate' | 'glass' = 'dark';
let currentPillOpacity = 0.92;
let currentPillColor = '#09090b';

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyPillAppearance(theme: 'dark' | 'light' | 'slate' | 'glass' = 'dark', opacity = 0.92, customColor?: string) {
  currentPillTheme = theme;
  currentPillOpacity = opacity;
  if (customColor) currentPillColor = customColor;

  document.body.classList.remove('theme-dark', 'theme-light', 'theme-slate', 'theme-glass');
  document.body.classList.add(`theme-${theme}`);

  document.documentElement.style.setProperty('--pill-opacity', String(opacity));

  if (customColor && theme !== 'glass') {
    const rgba = hexToRgba(customColor, opacity);
    document.documentElement.style.setProperty('--pill-bg', rgba);
    document.documentElement.style.setProperty('--pill-bubble-bg', rgba);
  } else {
    document.documentElement.style.removeProperty('--pill-bg');
    document.documentElement.style.removeProperty('--pill-bubble-bg');
  }

  if (selectPillTheme) selectPillTheme.value = theme;
  if (rangePillOpacity) rangePillOpacity.value = String(Math.round(opacity * 100));
  if (pillOpacityVal) pillOpacityVal.innerText = `${Math.round(opacity * 100)}%`;
  if (inputCustomPillColor && customColor) inputCustomPillColor.value = customColor;

  // Highlight active color preset button if matching
  document.querySelectorAll('.color-preset-btn').forEach(btn => {
    const btnColor = btn.getAttribute('data-color');
    if (btnColor && customColor && btnColor.toLowerCase() === customColor.toLowerCase()) {
      btn.classList.add('active-color');
    } else {
      btn.classList.remove('active-color');
    }
  });
}

const DEFAULT_SOLVE_PROMPT = 'Provide the direct written answer or code solution to the problem in the screenshot. If it is a coding question, output clean, runnable, 100% correct code in C programming language (simple standard C style, passing all visible and hidden test cases). If math or MCQ, output the exact answer value directly.';

// Show gentle floating toast notification
function showToast(message: string, icon = '🎯', durationMs = 2800) {
  if (!handsFreeToast || !handsFreeToastText) return;
  if (toastIcon) toastIcon.innerText = icon;
  handsFreeToastText.innerText = message;
  handsFreeToast.style.display = 'flex';
  handsFreeToast.classList.add('toast-visible');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    handsFreeToast.classList.remove('toast-visible');
    setTimeout(() => {
      handsFreeToast.style.display = 'none';
    }, 200);
  }, durationMs);
}

let multiSnapTimer: NodeJS.Timeout | null = null;
let multiSnapCountdown = 10;
let multiSnapCountdownInterval: NodeJS.Timeout | null = null;

function cancelMultiSnapTimer() {
  if (multiSnapTimer) {
    clearTimeout(multiSnapTimer);
    multiSnapTimer = null;
  }
  if (multiSnapCountdownInterval) {
    clearInterval(multiSnapCountdownInterval);
    multiSnapCountdownInterval = null;
  }
}

function updateClickThroughUI(enabled: boolean) {
  isClickThrough = enabled;
  if (chkClickThrough) chkClickThrough.checked = enabled;

  if (btnStealthClickThrough) {
    btnStealthClickThrough.classList.toggle('active-target', enabled);
    btnStealthClickThrough.title = enabled
      ? '🎯 Stealth Pass-Through Active (Hold Top-Left 2s or F6 to Drag/Click)'
      : '🎯 Toggle Stealth Pass-Through (Hold Top-Left 2s or F6)';
  }

  if (btnClickThroughToolbar) {
    btnClickThroughToolbar.classList.toggle('active-target', enabled);
    if (btnClickThroughText) {
      btnClickThroughText.innerText = enabled ? 'Pass-Through (ON)' : 'Pass-Through';
    }
  }
}

// Initialize
async function init() {
  setupEventListeners();
  setupIpcListeners();
  updateStealthBadge();
  await loadInitialConfig();
}

async function loadInitialConfig() {
  try {
    const config = await window.electronAPI.getConfig();
    if (config) {
      if (config.apiKey) inputApiKey.value = config.apiKey;
      if (inputOpenaiApiKey && config.openaiApiKey) inputOpenaiApiKey.value = config.openaiApiKey;
      if (selectAiProvider && config.aiProvider) selectAiProvider.value = config.aiProvider;
      updateAiModelOptions((config.aiProvider as any) || 'gemini', config.model);

      if (config.opacity) {
        rangeOpacity.value = String(Math.round(config.opacity * 100));
        opacityVal.innerText = `${rangeOpacity.value}%`;
      }
      chkAlwaysOnTop.checked = !!config.alwaysOnTop;
      chkPrivacyMode.checked = !!config.privacyMode;

      // Hands-free configurations
      isClickThrough = !!config.clickThrough;
      updateClickThroughUI(isClickThrough);

      if (chkHotCorner) chkHotCorner.checked = config.hotCornerEnabled !== false;
      if (selectHotCornerZone && config.hotCornerZone) selectHotCornerZone.value = config.hotCornerZone;
      if (selectHotCornerDwell && config.hotCornerDwellMs) selectHotCornerDwell.value = String(config.hotCornerDwellMs);
      if (hotCornerControls) hotCornerControls.style.display = (config.hotCornerEnabled !== false) ? 'flex' : 'none';

      if (chkAutoWatch) chkAutoWatch.checked = !!config.autoWatchEnabled;
      if (selectAutoWatchInterval && config.autoWatchIntervalSec) selectAutoWatchInterval.value = String(config.autoWatchIntervalSec);
      if (autoWatchControls) autoWatchControls.style.display = config.autoWatchEnabled ? 'block' : 'none';

      if (chkClipboardSolve) chkClipboardSolve.checked = !!config.clipboardAutoSolve;

      // Pill & Overlay Appearance Configuration
      applyPillAppearance(
        (config.pillTheme as any) || 'dark',
        config.pillOpacity !== undefined ? config.pillOpacity : 0.92,
        config.pillCustomColor || '#09090b'
      );

      // If no API key configured yet (neither Gemini nor OpenAI), prompt user on first launch
      const hasKey = (config.apiKey && config.apiKey.trim()) || (config.openaiApiKey && config.openaiApiKey.trim());
      if (!hasKey) {
        toggleGhostMode(false);
        if (settingsModal) settingsModal.style.display = 'flex';
      }
    }
  } catch (err) {
    console.error('Failed to load initial config:', err);
  }
}

function openSettingsModal() {
  if (!settingsModal) return;
  window.electronAPI.setFocusable(true);
  window.electronAPI.setClickThrough(false);
  settingsModal.style.display = 'flex';
  setTimeout(() => {
    if (selectAiProvider && selectAiProvider.value === 'openai' && inputOpenaiApiKey) {
      inputOpenaiApiKey.focus();
    } else if (inputApiKey) {
      inputApiKey.focus();
    }
  }, 80);
}

function closeSettingsModal() {
  if (!settingsModal) return;
  settingsModal.style.display = 'none';
  window.electronAPI.setClickThrough(true);
  window.electronAPI.setFocusable(false);
  window.electronAPI.restoreFocus();
}

function setupEventListeners() {
  // Global non-activating click guard: only restore focus when clicking non-interactive backdrop
  document.addEventListener('pointerdown', (e: MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('button, input, select, textarea, .ghost-bubble, .modal-card, .modal-body, .form-group, .chip, .code-container, .suggested-chips, .stealth-dock, .stealth-input-bar, .stealth-response-bubble')) {
      return;
    }
    if (settingsModal.style.display !== 'flex' && docsModal.style.display !== 'flex') {
      window.electronAPI.restoreFocus();
    }
  });

  // Input auto-resize
  promptInput.addEventListener('input', () => {
    promptInput.style.height = 'auto';
    promptInput.style.height = `${Math.min(promptInput.scrollHeight, 120)}px`;
  });

  promptInput.addEventListener('blur', () => {
    window.electronAPI.restoreFocus();
  });

  // Ghost / Stealth Mode Toolbar Button
  if (btnStealthToolbar) {
    btnStealthToolbar.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGhostMode();
    });
  }

  // Stealth Dock Buttons
  if (btnStealthClickThrough) {
    btnStealthClickThrough.addEventListener('click', async (e) => {
      e.stopPropagation();
      const next = await window.electronAPI.toggleClickThrough();
      updateClickThroughUI(next);
      showToast(next ? '🎯 Mouse Pass-Through Active (Zero Hover Alert)' : '⚡ Interactive Mode Active');
    });
  }

  if (btnClickThroughToolbar) {
    btnClickThroughToolbar.addEventListener('click', async (e) => {
      e.stopPropagation();
      const next = await window.electronAPI.toggleClickThrough();
      updateClickThroughUI(next);
      showToast(next ? '🎯 Mouse Pass-Through Active (Zero Hover Alert)' : '⚡ Interactive Mode Active');
    });
  }

  if (chkHotCorner) {
    chkHotCorner.addEventListener('change', () => {
      if (hotCornerControls) {
        hotCornerControls.style.display = chkHotCorner.checked ? 'flex' : 'none';
      }
    });
  }

  if (chkAutoWatch) {
    chkAutoWatch.addEventListener('change', () => {
      if (autoWatchControls) {
        autoWatchControls.style.display = chkAutoWatch.checked ? 'block' : 'none';
      }
    });
  }

  if (btnStealthSolve) {
    btnStealthSolve.addEventListener('click', async (e) => {
      e.stopPropagation();
      await solveFromStealth();
      window.electronAPI.restoreFocus();
    });
  }

  if (btnStealthSnap) {
    btnStealthSnap.addEventListener('click', async (e) => {
      e.stopPropagation();
      await snapScreen();
      window.electronAPI.restoreFocus();
    });
  }

  if (btnStealthPrompt) {
    btnStealthPrompt.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStealthInputBar();
    });
  }

  if (btnStealthExpand) {
    btnStealthExpand.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGhostMode(false);
    });
  }

  if (btnStealthSend) {
    btnStealthSend.addEventListener('click', (e) => {
      e.stopPropagation();
      sendStealthPrompt();
      window.electronAPI.restoreFocus();
    });
  }

  // Quick Directive Chips (MCQ, Python, Java, Math, Bug Fix)
  document.querySelectorAll('.stealth-chip-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const chipPrompt = (btn as HTMLElement).getAttribute('data-prompt');
      if (chipPrompt) {
        if (stealthInputBar) stealthInputBar.style.display = 'none';
        adjustStealthBounds();
        await solveFromStealth(chipPrompt);
        window.electronAPI.restoreFocus();
      }
    });
  });

  // From Clipboard Chip Handler (Auto-Inject custom text without typing or losing focus)
  const btnStealthClipPrompt = document.getElementById('btnStealthClipPrompt');
  if (btnStealthClipPrompt) {
    btnStealthClipPrompt.addEventListener('click', async (e) => {
      e.stopPropagation();
      let promptToSend = DEFAULT_SOLVE_PROMPT;
      try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0) {
          promptToSend = `Solve the problem in the screenshot.\nAdditional instruction/context from user: "${text.trim()}"`;
        }
      } catch (err) {}
      if (stealthInputBar) stealthInputBar.style.display = 'none';
      adjustStealthBounds();
      await solveFromStealth(promptToSend);
      window.electronAPI.restoreFocus();
    });
  }

  if (stealthInputText) {
    stealthInputText.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      window.electronAPI.setFocusable(true);
      stealthInputText.focus();
    });
    stealthInputText.addEventListener('click', (e) => {
      e.stopPropagation();
      window.electronAPI.setFocusable(true);
      stealthInputText.focus();
    });
    stealthInputText.addEventListener('blur', () => {
      window.electronAPI.setFocusable(false);
      window.electronAPI.restoreFocus();
    });
    stealthInputText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendStealthPrompt();
        window.electronAPI.setFocusable(false);
        window.electronAPI.restoreFocus();
      }
    });
  }

  // Copy button inside stealth response bubble
  const btnStealthCopyInline = document.getElementById('btnStealthCopyInline') as HTMLButtonElement;
  if (btnStealthCopyInline) {
    btnStealthCopyInline.addEventListener('click', (e) => {
      e.stopPropagation();
      if (stealthResponseContent) {
        navigator.clipboard.writeText(stealthResponseContent.innerText);
        btnStealthCopyInline.innerText = '✅ Copied!';
        setTimeout(() => { btnStealthCopyInline.innerText = '📋 Copy'; }, 1500);
      }
      window.electronAPI.restoreFocus();
    });
  }

  // Expand button inside stealth response bubble (switches seamlessly to full window)
  const btnStealthExpandInline = document.getElementById('btnStealthExpandInline') as HTMLButtonElement;
  if (btnStealthExpandInline) {
    btnStealthExpandInline.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleGhostMode(false);
    });
  }

  // Close button inside stealth response bubble
  const btnStealthCloseInline = document.getElementById('btnStealthCloseInline') as HTMLButtonElement;
  if (btnStealthCloseInline) {
    btnStealthCloseInline.addEventListener('click', (e) => {
      e.stopPropagation();
      stealthResponseBubble.style.display = 'none';
      adjustStealthBounds();
      window.electronAPI.restoreFocus();
    });
  }

  // Scroll Up/Down Micro-buttons on Solution Bubble
  if (btnStealthScrollUp) {
    btnStealthScrollUp.addEventListener('click', (e) => {
      e.stopPropagation();
      if (stealthResponseContent) {
        stealthResponseContent.scrollTop -= 80;
      }
    });
  }
  if (btnStealthScrollDown) {
    btnStealthScrollDown.addEventListener('click', (e) => {
      e.stopPropagation();
      if (stealthResponseContent) {
        stealthResponseContent.scrollTop += 80;
      }
    });
  }

  // Double Click on micro solution bubble dismisses it
  if (stealthResponseBubble) {
    stealthResponseBubble.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      stealthResponseBubble.style.display = 'none';
      adjustStealthBounds();
      window.electronAPI.restoreFocus();
    });
  }

  // Stealth Dock Dragging & Double Click Restore
  let isDraggingDock = false;
  let dockStartX = 0;
  let dockStartY = 0;

  const startDrag = (e: PointerEvent) => {
    isDraggingDock = true;
    dockStartX = e.screenX;
    dockStartY = e.screenY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    window.electronAPI.restoreFocus();
  };

  const doDrag = (e: PointerEvent) => {
    if (!isDraggingDock) return;
    const dx = e.screenX - dockStartX;
    const dy = e.screenY - dockStartY;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      window.electronAPI.moveWindowBy(dx, dy);
      dockStartX = e.screenX;
      dockStartY = e.screenY;
    }
  };

  const endDrag = (e: PointerEvent) => {
    if (isDraggingDock) {
      isDraggingDock = false;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      window.electronAPI.restoreFocus();
    }
  };

  if (stealthDragHandle) {
    stealthDragHandle.addEventListener('pointerdown', startDrag);
    stealthDragHandle.addEventListener('pointermove', doDrag);
    stealthDragHandle.addEventListener('pointerup', endDrag);
  }

  if (stealthDock) {
    stealthDock.addEventListener('pointerdown', () => {
      window.electronAPI.restoreFocus();
    });
    stealthDock.addEventListener('dblclick', () => {
      toggleGhostMode(false);
    });
  }

  // Enter to send
  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      window.electronAPI.setFocusable(false);
      window.electronAPI.restoreFocus();
    }
  });

  // Send button
  btnSend.addEventListener('click', () => {
    handleSend();
    window.electronAPI.setFocusable(false);
    window.electronAPI.restoreFocus();
  });

  // Snap Screen Button (Multi-screenshot support up to 5)
  btnSnapScreen.addEventListener('click', async (e) => {
    e.stopPropagation();
    await snapScreen();
  });

  // Auto-Solve Button
  btnAutoSolve.addEventListener('click', async (e) => {
    e.stopPropagation();
    await snapAndAutoSolve();
  });

  // Paste from clipboard button
  btnPasteClipboard.addEventListener('click', async (e) => {
    e.stopPropagation();
    await readClipboardAndAttach();
  });

  // Clear all attachments button
  if (btnClearAllAttachments) {
    btnClearAllAttachments.addEventListener('click', (e) => {
      e.stopPropagation();
      clearAllAttachments();
    });
    btnClearAllAttachments.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  // Clear / Delete chat
  btnClearChat.addEventListener('click', (e) => {
    e.stopPropagation();
    chatHistory = [];
    chatContainer.innerHTML = '';
    chatContainer.appendChild(welcomeBox);
    welcomeBox.style.display = 'block';
    clearAllAttachments();
  });

  // Suggestion chips
  document.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const prompt = chip.getAttribute('data-prompt') || '';
      promptInput.value = prompt;
      promptInput.focus();
      promptInput.style.height = 'auto';
      promptInput.style.height = `${Math.min(promptInput.scrollHeight, 120)}px`;
    });
  });

  // Welcome shortcut cards interactive triggers
  const cardSnapSolve = document.getElementById('cardSnapSolve');
  if (cardSnapSolve) {
    cardSnapSolve.addEventListener('click', () => {
      snapAndAutoSolve();
    });
  }

  const cardStealthMode = document.getElementById('cardStealthMode');
  if (cardStealthMode) {
    cardStealthMode.addEventListener('click', () => {
      toggleGhostMode(true);
    });
  }

  // Global paste handler (Ctrl+V)
  window.addEventListener('paste', async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            addAttachment({
              base64,
              mimeType: file.type || 'image/png',
              dataUrl
            });
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }
  });

  // Window Controls
  btnMinimize.addEventListener('click', (e) => {
    e.stopPropagation();
    window.electronAPI.minimizeWindow();
  });
  btnClose.addEventListener('click', (e) => {
    e.stopPropagation();
    window.electronAPI.closeWindow();
  });

  // Docs Modal Controls
  if (btnDocs) {
    btnDocs.addEventListener('click', () => {
      docsModal.style.display = 'flex';
    });
  }
  if (btnCloseDocs) {
    btnCloseDocs.addEventListener('click', () => {
      docsModal.style.display = 'none';
    });
  }
  if (btnDoneDocs) {
    btnDoneDocs.addEventListener('click', () => {
      docsModal.style.display = 'none';
    });
  }
  if (docsBackdrop) {
    docsBackdrop.addEventListener('click', () => {
      docsModal.style.display = 'none';
    });
  }

  // Settings Modal Controls
  btnSettings.addEventListener('click', () => {
    openSettingsModal();
  });
  btnCloseSettings.addEventListener('click', () => {
    closeSettingsModal();
  });
  modalBackdrop.addEventListener('click', () => {
    closeSettingsModal();
  });

  // Opacity Slider live update
  rangeOpacity.addEventListener('input', () => {
    const val = Number(rangeOpacity.value);
    opacityVal.innerText = `${val}%`;
    window.electronAPI.setOpacity(val / 100);
  });

  // Appearance & Pill Customization Inputs
  if (selectPillTheme) {
    selectPillTheme.addEventListener('change', () => {
      applyPillAppearance(selectPillTheme.value as any, currentPillOpacity, currentPillColor);
    });
  }

  if (rangePillOpacity) {
    rangePillOpacity.addEventListener('input', () => {
      const op = Number(rangePillOpacity.value) / 100;
      if (pillOpacityVal) pillOpacityVal.innerText = `${rangePillOpacity.value}%`;
      applyPillAppearance(currentPillTheme, op, currentPillColor);
    });
  }

  document.querySelectorAll('.color-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const col = btn.getAttribute('data-color') || '#09090b';
      applyPillAppearance(currentPillTheme, currentPillOpacity, col);
    });
  });

  if (inputCustomPillColor) {
    inputCustomPillColor.addEventListener('input', () => {
      applyPillAppearance(currentPillTheme, currentPillOpacity, inputCustomPillColor.value);
    });
  }

  // AI Intelligence Provider Selector
  if (selectAiProvider) {
    selectAiProvider.addEventListener('change', () => {
      updateAiModelOptions(selectAiProvider.value as any);
    });
  }

  // Save Settings
  btnSaveSettings.addEventListener('click', async () => {
    const updated = {
      aiProvider: selectAiProvider ? selectAiProvider.value : 'gemini',
      apiKey: inputApiKey.value.trim(),
      openaiApiKey: inputOpenaiApiKey ? inputOpenaiApiKey.value.trim() : '',
      model: selectModel.value,
      opacity: Number(rangeOpacity.value) / 100,
      alwaysOnTop: chkAlwaysOnTop.checked,
      privacyMode: chkPrivacyMode.checked,
      clickThrough: chkClickThrough ? chkClickThrough.checked : false,
      hotCornerEnabled: chkHotCorner ? chkHotCorner.checked : true,
      hotCornerZone: selectHotCornerZone ? selectHotCornerZone.value : 'top-right',
      hotCornerDwellMs: selectHotCornerDwell ? Number(selectHotCornerDwell.value) : 3000,
      autoWatchEnabled: chkAutoWatch ? chkAutoWatch.checked : false,
      autoWatchIntervalSec: selectAutoWatchInterval ? Number(selectAutoWatchInterval.value) : 30,
      clipboardAutoSolve: chkClipboardSolve ? chkClipboardSolve.checked : false,
      pillTheme: selectPillTheme ? (selectPillTheme.value as any) : currentPillTheme,
      pillOpacity: rangePillOpacity ? Number(rangePillOpacity.value) / 100 : currentPillOpacity,
      pillCustomColor: currentPillColor
    };
    await window.electronAPI.updateConfig(updated);
    updateClickThroughUI(updated.clickThrough);
    closeSettingsModal();
    showToast('⚙️ Settings saved successfully', '✅', 2000);
  });
}

function setupIpcListeners() {
  // Click-Through toggle from main process / hotkey (F6) / Top-Left corner dwell
  window.electronAPI.onClickThroughToggled((enabled: boolean) => {
    updateClickThroughUI(enabled);
    showToast(
      enabled
        ? '🎯 Stealth Pass-Through Locked (0 Hover Alerts). Hold Top-Left (2s) or F6 to Unlock.'
        : '🔓 Interactive Drag Mode Active. You can now drag, reposition, and click Clovi.',
      enabled ? '🎯' : '🔓',
      3500
    );
  });

  // Hot Corner Hold Triggered Event (Top-Right)
  window.electronAPI.onHotCornerTriggered(() => {
    showToast('⚡ Hot Corner Hold Triggered: Solving...', '⚡', 2500);
  });

  // Hot Corner Multi-Snap Event (Bottom-Left 1.5s Dwell + 10s Idle Timer)
  window.electronAPI.onHotCornerMultiSnap((screenshot: any) => {
    if (screenshot && screenshot.dataUrl) {
      if (attachedImages.length >= MAX_ATTACHMENTS) {
        showToast(`📸 Maximum ${MAX_ATTACHMENTS} screenshots reached!`, '⚠️', 2500);
      } else {
        addAttachment({
          base64: screenshot.base64,
          mimeType: screenshot.mimeType,
          dataUrl: screenshot.dataUrl
        });
      }

      // Reset and start the 10s idle countdown timer
      cancelMultiSnapTimer();

      multiSnapCountdown = 10;
      showToast(`📸 Attached Screenshot #${attachedImages.length}! Auto-solving in ${multiSnapCountdown}s... (Hover bottom-left again to add more)`, '📸', 3500);

      multiSnapCountdownInterval = setInterval(() => {
        multiSnapCountdown--;
        if (multiSnapCountdown <= 0) {
          if (multiSnapCountdownInterval) {
            clearInterval(multiSnapCountdownInterval);
            multiSnapCountdownInterval = null;
          }
        }
      }, 1000);

      multiSnapTimer = setTimeout(async () => {
        cancelMultiSnapTimer();
        if (attachedImages.length > 0) {
          showToast(`⚡ Solving with ${attachedImages.length} attached screenshot(s)...`, '⚡', 2500);
          const promptToUse = DEFAULT_SOLVE_PROMPT;
          if (isGhostMode) {
            await sendStealthPrompt(promptToUse);
          } else {
            promptInput.value = promptToUse;
            await handleSend();
          }
        }
      }, 10000);
    }
  });

  // Transparent Mode Virtual Mouse Scroll (0 Hover Detection)
  window.electronAPI.onScrollWheel(({ deltaY }: { deltaY: number; x: number; y: number }) => {
    if (stealthResponseContent && stealthResponseBubble && stealthResponseBubble.style.display !== 'none') {
      stealthResponseContent.scrollTop += deltaY;
    } else if (chatContainer) {
      chatContainer.scrollTop += deltaY;
    }
  });

  // Real-time Drag-to-Scroll (Middle Mouse Button / Right-Click Drag)
  window.electronAPI.onDragScroll(({ deltaY }: { deltaY: number }) => {
    if (stealthResponseContent && stealthResponseBubble && stealthResponseBubble.style.display !== 'none') {
      stealthResponseContent.scrollTop += deltaY;
    } else if (chatContainer) {
      chatContainer.scrollTop += deltaY;
    }
  });

  // Transparent Mode Virtual Click Dispatcher (Allows clicking all buttons without mouse exit alerts)
  window.electronAPI.onVirtualClick(({ x, y }: { x: number; y: number }) => {
    if (!isClickThrough) return;

    // Search all layered elements at coordinates
    const elements = document.elementsFromPoint(x, y);
    if (!elements || elements.length === 0) return;

    for (const el of elements) {
      const clickable = el.closest('button, .clickable, input, select, textarea, a, .ghost-bubble, .chip, .stealth-chip-btn, .stealth-btn, .icon-btn, .toolbar-btn, .btn-copy-msg, .stealth-copy-btn, .btn-close-stealth');
      if (clickable instanceof HTMLElement) {
        clickable.click();
        return;
      }
    }
  });

  // Transparent Mode Virtual Middle-Click Quick Copy
  window.electronAPI.onVirtualMiddleClick(() => {
    if (currentStreamingText && currentStreamingText.trim()) {
      navigator.clipboard.writeText(currentStreamingText.trim());
      showToast('📋 Solution Copied to Clipboard!', '📋', 2000);
    }
  });

  // Main process direct button event listeners
  window.electronAPI.onOpenSettings(() => {
    openSettingsModal();
  });

  window.electronAPI.onOpenDocs(() => {
    if (docsModal) docsModal.style.display = 'flex';
  });

  window.electronAPI.onToggleStealthPrompt(() => {
    toggleStealthInputBar();
  });

  // Streaming chunks
  window.electronAPI.onStreamChunk((chunk: string) => {
    currentStreamingText += chunk;

    // 1. Update stealth micro-bubble if in ghost mode
    if (isGhostMode) {
      if (stealthSolveSpinner) stealthSolveSpinner.style.display = 'none';
      if (stealthSolveIcon) stealthSolveIcon.style.display = 'inline-block';
      if (stealthResponseBubble && stealthResponseBubble.style.display === 'none') {
        stealthResponseBubble.style.display = 'flex';
        adjustStealthBounds();
      }
      if (stealthResponseContent) {
        const isNearBottom = stealthResponseContent.scrollHeight - stealthResponseContent.scrollTop - stealthResponseContent.clientHeight < 60;
        renderMarkdownInto(stealthResponseContent, currentStreamingText, true, true);
        if (isNearBottom) {
          stealthResponseContent.scrollTop = stealthResponseContent.scrollHeight;
        }
      }
    }

    // 2. Always update the main window chat bubble in parallel
    if (currentStreamingBubble) {
      const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 60;
      renderMarkdownInto(currentStreamingBubble, currentStreamingText, true, false);
      if (isNearBottom) {
        scrollToBottom();
      }
    }
  });

  // Streaming done
  window.electronAPI.onStreamDone((fullText: string) => {
    // 1. Finalize stealth micro-bubble
    if (isGhostMode) {
      if (stealthSolveSpinner) stealthSolveSpinner.style.display = 'none';
      if (stealthSolveIcon) stealthSolveIcon.style.display = 'inline-block';
      if (stealthResponseBubble && stealthResponseBubble.style.display === 'none') {
        stealthResponseBubble.style.display = 'flex';
        adjustStealthBounds();
      }
      if (stealthResponseContent) {
        renderMarkdownInto(stealthResponseContent, fullText, false, true);
        stealthResponseContent.scrollTop = 0; // Scroll to top so user can read solution from start
      }
    }

    // 2. Finalize main window chat bubble
    if (currentStreamingBubble) {
      renderMarkdownInto(currentStreamingBubble, fullText, false);
      scrollToBottom();
    }

    // 3. Save to chat history
    chatHistory.push({
      role: 'model',
      text: fullText
    });
    finalizeGeneration();
  });

  // Stream error
  window.electronAPI.onStreamError((err: string) => {
    if (isGhostMode) {
      if (stealthSolveSpinner) stealthSolveSpinner.style.display = 'none';
      if (stealthSolveIcon) stealthSolveIcon.style.display = 'inline-block';
      if (stealthResponseBubble) {
        stealthResponseBubble.style.display = 'flex';
        adjustStealthBounds();
      }
      if (stealthResponseContent) {
        stealthResponseContent.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${escapeHtml(err)}</span>`;
      }
    }
    if (currentStreamingBubble) {
      currentStreamingBubble.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${escapeHtml(err)}</span>`;
      scrollToBottom();
    }
    finalizeGeneration();
  });

  // Global Snap shortcut handler
  window.electronAPI.onGlobalSnap((screenshot: any) => {
    if (screenshot && screenshot.dataUrl) {
      addAttachment({
        base64: screenshot.base64,
        mimeType: screenshot.mimeType,
        dataUrl: screenshot.dataUrl
      });
    }
  });

  // Global Snap & Auto-Solve shortcut handler
  window.electronAPI.onGlobalSolve((payload: any) => {
    const screenshot = payload?.screenshot || payload;
    const customPrompt = payload?.customPrompt;

    if (screenshot && screenshot.dataUrl) {
      clearAllAttachments();
      addAttachment({
        base64: screenshot.base64,
        mimeType: screenshot.mimeType,
        dataUrl: screenshot.dataUrl
      });
      const promptToUse = customPrompt || DEFAULT_SOLVE_PROMPT;
      if (isGhostMode) {
        sendStealthPrompt(promptToUse);
      } else {
        promptInput.value = promptToUse;
        handleSend();
      }
    }
  });

  // Global toggle ghost mode handler
  window.electronAPI.onToggleGhostMode(() => {
    toggleGhostMode();
  });
}

async function toggleGhostMode(forced?: boolean) {
  const targetMode = typeof forced === 'boolean' ? forced : !isGhostMode;
  if (targetMode === isGhostMode && typeof forced !== 'undefined') return;
  isGhostMode = targetMode;

  overlayContainer.classList.add('mode-transitioning');

  if (isGhostMode) {
    if (stealthResponseBubble) stealthResponseBubble.style.display = 'none';
    if (stealthInputBar) stealthInputBar.style.display = 'none';
    
    await window.electronAPI.setGhostMode(true);
    
    overlayContainer.classList.add('ghost-active');
    if (stealthContainer) stealthContainer.style.display = 'flex';
    updateStealthBadge();
  } else {
    await window.electronAPI.setGhostMode(false);
    
    overlayContainer.classList.remove('ghost-active');
    if (stealthContainer) stealthContainer.style.display = 'none';
    if (stealthResponseBubble) stealthResponseBubble.style.display = 'none';
    if (stealthInputBar) stealthInputBar.style.display = 'none';
    scrollToBottom();
  }

  requestAnimationFrame(() => {
    setTimeout(() => {
      overlayContainer.classList.remove('mode-transitioning');
    }, 60);
  });
}

function updateStealthBadge() {
  if (stealthSnapBadge) {
    stealthSnapBadge.innerText = String(attachedImages.length);
    stealthSnapBadge.style.display = attachedImages.length > 0 ? 'flex' : 'none';
  }
}

function toggleStealthInputBar(forced?: boolean) {
  if (!stealthInputBar) return;
  const show = typeof forced === 'boolean' ? forced : (stealthInputBar.style.display === 'none');
  stealthInputBar.style.display = show ? 'flex' : 'none';
  if (show && stealthInputText) {
    stealthInputText.focus();
  }
  adjustStealthBounds();
}

function adjustStealthBounds() {
  if (!isGhostMode) return;
  const hasBubble = stealthResponseBubble && stealthResponseBubble.style.display !== 'none';
  const hasInput = stealthInputBar && stealthInputBar.style.display !== 'none';

  let targetWidth = 210;
  let targetHeight = 48;

  if (hasBubble && hasInput) {
    targetWidth = 380;
    targetHeight = 360;
  } else if (hasBubble) {
    targetWidth = 380;
    targetHeight = 300;
  } else if (hasInput) {
    targetWidth = 340;
    targetHeight = 124; // Generous height for dock (44px) + gap (6px) + chips & textarea (68px) + padding (6px)
  } else {
    targetWidth = 210;
    targetHeight = 48;
  }

  window.electronAPI.resizeStealth(targetWidth, targetHeight);
}

async function solveFromStealth(promptOverride?: string) {
  try {
    const screenshot = await window.electronAPI.captureScreen();
    if (screenshot) {
      clearAllAttachments();
      addAttachment(screenshot);
      await sendStealthPrompt(promptOverride || DEFAULT_SOLVE_PROMPT);
    }
  } catch (err) {
    console.error('Stealth solve failed:', err);
  }
}

async function sendStealthPrompt(customPrompt?: string) {
  if (isGenerating) return;

  if (!inputApiKey.value || !inputApiKey.value.trim()) {
    toggleGhostMode(false);
    if (settingsModal) settingsModal.style.display = 'flex';
    return;
  }

  const userText = stealthInputText ? stealthInputText.value.trim() : '';
  const promptText = typeof customPrompt === 'string' ? customPrompt : (userText || DEFAULT_SOLVE_PROMPT);
  const currentImgs = [...attachedImages];

  if (!promptText && currentImgs.length === 0) return;

  // Show blue buffering spinner on the solve icon
  if (stealthSolveIcon) stealthSolveIcon.style.display = 'none';
  if (stealthSolveSpinner) stealthSolveSpinner.style.display = 'inline-block';
  // Keep solution bubble hidden while buffering so no big white box is visible
  if (stealthResponseBubble) stealthResponseBubble.style.display = 'none';
  adjustStealthBounds();

  // Clear inputs
  if (stealthInputText) stealthInputText.value = '';
  clearAllAttachments();

  // Seamlessly sync to main window chatContainer
  if (welcomeBox) welcomeBox.style.display = 'none';
  const displayLabel = promptText || (currentImgs.length > 0 ? `📸 Snap (${currentImgs.length}) & Solve` : '');
  appendUserMessage(displayLabel, currentImgs.map(i => i.dataUrl));

  const bubble = appendGeminiPlaceholder();
  currentStreamingBubble = bubble;
  currentStreamingText = '';
  isGenerating = true;

  try {
    const imagesPayload = currentImgs.map(i => ({ base64: i.base64, mimeType: i.mimeType }));
    await window.electronAPI.sendPrompt({
      prompt: promptText,
      images: imagesPayload,
      history: chatHistory
    });

    chatHistory.push({
      role: 'user',
      text: promptText,
      images: imagesPayload
    });
  } catch (err: any) {
    if (stealthSolveSpinner) stealthSolveSpinner.style.display = 'none';
    if (stealthSolveIcon) stealthSolveIcon.style.display = 'inline-block';
    if (stealthResponseBubble) {
      stealthResponseBubble.style.display = 'flex';
      adjustStealthBounds();
    }
    if (stealthResponseContent) {
      stealthResponseContent.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${escapeHtml(err.message)}</span>`;
    }
    if (currentStreamingBubble) {
      currentStreamingBubble.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${escapeHtml(err.message)}</span>`;
    }
    finalizeGeneration();
  }
}

async function snapScreen() {
  try {
    const screenshot = await window.electronAPI.captureScreen();
    if (screenshot) {
      addAttachment(screenshot);
    }
  } catch (err: any) {
    console.error('Screen capture failed:', err);
  }
}

async function snapAndAutoSolve() {
  try {
    const screenshot = await window.electronAPI.captureScreen();
    if (screenshot) {
      clearAllAttachments();
      addAttachment(screenshot);
      promptInput.value = 'Give the direct written answer to the question in this screenshot.';
      handleSend();
    }
  } catch (err: any) {
    console.error('Snap & solve failed:', err);
  }
}

async function readClipboardAndAttach() {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      const imageType = item.types.find(t => t.startsWith('image/'));
      if (imageType) {
        const blob = await item.getType(imageType);
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          addAttachment({
            base64: dataUrl.split(',')[1],
            mimeType: imageType,
            dataUrl
          });
        };
        reader.readAsDataURL(blob);
        return;
      }
    }
    // If no image, read text
    const text = await navigator.clipboard.readText();
    if (text) {
      promptInput.value = text;
      promptInput.focus();
    }
  } catch (err) {
    console.warn('Clipboard read error:', err);
  }
}

function addAttachment(img: AttachedImage) {
  if (attachedImages.length >= MAX_ATTACHMENTS) {
    alert(`Maximum of ${MAX_ATTACHMENTS} screenshots reached.`);
    return;
  }
  attachedImages.push(img);
  renderAttachments();
}

function removeAttachment(index: number) {
  if (index >= 0 && index < attachedImages.length) {
    attachedImages.splice(index, 1);
    renderAttachments();
  }
}

function clearAllAttachments() {
  cancelMultiSnapTimer();
  attachedImages = [];
  renderAttachments();
}

function renderAttachments() {
  updateStealthBadge();
  if (attachedImages.length === 0) {
    attachmentPreview.style.display = 'none';
    thumbList.innerHTML = '';
    return;
  }

  attachmentPreview.style.display = 'flex';
  if (attachmentLabel) {
    attachmentLabel.innerText = `📸 Attached Screenshots (${attachedImages.length}/${MAX_ATTACHMENTS})`;
  }

  thumbList.innerHTML = '';
  attachedImages.forEach((img, idx) => {
    const item = document.createElement('div');
    item.className = 'thumb-item';

    const imageEl = document.createElement('img');
    imageEl.src = img.dataUrl;
    imageEl.alt = `Screenshot ${idx + 1}`;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-thumb-remove';
    removeBtn.innerText = '✕';
    removeBtn.title = 'Remove this screenshot';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeAttachment(idx);
    });
    removeBtn.addEventListener('pointerdown', (e) => e.stopPropagation());

    item.appendChild(imageEl);
    item.appendChild(removeBtn);
    thumbList.appendChild(item);
  });
}

async function handleSend() {
  if (isGenerating) return;

  const promptText = promptInput.value.trim();
  const currentImgs = [...attachedImages];

  if (!promptText && currentImgs.length === 0) return;

  welcomeBox.style.display = 'none';

  // Add User Message UI
  const displayLabel = promptText || (currentImgs.length > 0 ? `📸 Analyze ${currentImgs.length} Snapshot(s) & Solve` : '');
  appendUserMessage(displayLabel, currentImgs.map(i => i.dataUrl));

  // Clear inputs
  promptInput.value = '';
  promptInput.style.height = 'auto';
  clearAllAttachments();

  // Create Gemini streaming response placeholder
  const bubble = appendGeminiPlaceholder();
  currentStreamingBubble = bubble;
  currentStreamingText = '';
  isGenerating = true;
  btnSend.disabled = true;

  try {
    const imagesPayload = currentImgs.map(i => ({ base64: i.base64, mimeType: i.mimeType }));
    await window.electronAPI.sendPrompt({
      prompt: promptText,
      images: imagesPayload,
      history: chatHistory
    });

    // Add to history
    chatHistory.push({
      role: 'user',
      text: promptText,
      images: imagesPayload
    });
  } catch (err: any) {
    bubble.innerHTML = `<span style="color: #ef4444;">⚠️ Error: ${escapeHtml(err.message)}</span>`;
    finalizeGeneration();
  }
}

function appendUserMessage(text: string, imageUrls?: string | string[]) {
  const row = document.createElement('div');
  row.className = 'message-row user';

  const avatar = document.createElement('div');
  avatar.className = 'avatar user';
  avatar.innerText = '👤';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  if (imageUrls) {
    const urls = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    if (urls.length === 1) {
      const img = document.createElement('img');
      img.src = urls[0];
      img.className = 'msg-thumbnail';
      bubble.appendChild(img);
    } else if (urls.length > 1) {
      const grid = document.createElement('div');
      grid.style.display = 'flex';
      grid.style.flexWrap = 'wrap';
      grid.style.gap = '4px';
      grid.style.marginBottom = '5px';
      urls.forEach(u => {
        const img = document.createElement('img');
        img.src = u;
        img.style.maxWidth = '48%';
        img.style.maxHeight = '90px';
        img.style.borderRadius = '4px';
        img.style.objectFit = 'cover';
        grid.appendChild(img);
      });
      bubble.appendChild(grid);
    }
  }

  if (text) {
    const textNode = document.createElement('div');
    textNode.innerText = text;
    bubble.appendChild(textNode);
  }

  row.appendChild(avatar);
  row.appendChild(bubble);
  chatContainer.appendChild(row);
  scrollToBottom();
}

function appendGeminiPlaceholder(): HTMLElement {
  const row = document.createElement('div');
  row.className = 'message-row gemini';

  const avatar = document.createElement('div');
  avatar.className = 'avatar gemini';
  avatar.innerHTML = '✨';

  const wrapper = document.createElement('div');
  wrapper.className = 'gemini-content-wrapper';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';
  bubble.innerHTML = '<span class="typing-cursor"></span>';

  const actions = document.createElement('div');
  actions.className = 'msg-actions';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'btn-copy-msg';
  copyBtn.innerHTML = '📋 Copy';
  copyBtn.title = 'Copy response to clipboard';
  copyBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(bubble.innerText);
    copyBtn.innerHTML = '✅ Copied!';
    setTimeout(() => { copyBtn.innerHTML = '📋 Copy'; }, 1500);
  });

  actions.appendChild(copyBtn);
  wrapper.appendChild(bubble);
  wrapper.appendChild(actions);

  row.appendChild(avatar);
  row.appendChild(wrapper);
  chatContainer.appendChild(row);
  scrollToBottom();

  return bubble;
}

function finalizeGeneration() {
  isGenerating = false;
  btnSend.disabled = false;
  currentStreamingBubble = null;
  currentStreamingText = '';
}

function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Markdown parser & Renderer with real-time partial fence parsing and LaTeX math formatting
function renderMarkdownInto(container: HTMLElement, rawMarkdown: string, isStreaming: boolean, isStealthMicro: boolean = false) {
  let text = rawMarkdown;

  // If streaming and there is an unclosed code block, auto-close for clean rendering
  if (isStreaming) {
    const fenceCount = (text.match(/```/g) || []).length;
    if (fenceCount % 2 !== 0) {
      text += '\n```';
    }
  }

  let html = text;

  // Format LaTeX Math blocks and inline expressions
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_m, math) => `<div class="math-block">${formatMathSymbols(math.trim())}</div>`);
  html = html.replace(/\\\(([\s\S]*?)\\\)/g, (_m, math) => `<span class="math-inline">${formatMathSymbols(math.trim())}</span>`);

  if (isStealthMicro) {
    // In stealth capsule popup, render clean scrollable plain text with clean monospace styling so large outputs remain ultra-readable
    html = html.replace(/```[a-zA-Z0-9_\-\+]*\n([\s\S]*?)```/g, (_match, code) => {
      const escapedCode = escapeHtml(code.trim());
      return `<pre class="stealth-plain-code"><code>${escapedCode}</code></pre>`;
    });
  } else {
    // Standard full window code block
    html = html.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const cleanLang = lang || 'code';
      const escapedCode = escapeHtml(code.trim());
      return `<div class="code-container">
        <div class="code-header">
          <span>${escapeHtml(cleanLang)}</span>
          <button class="btn-copy-code" onclick="copyCodeSnippet(this)">📋 Copy</button>
        </div>
        <pre><code>${escapedCode}</code></pre>
      </div>`;
    });
  }

  // Inline code `code`
  html = html.replace(/`([^`]+)`/g, (_match, code) => {
    return `<code>${escapeHtml(code)}</code>`;
  });

  // Bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic *text*
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Bullet points
  html = html.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  // Linebreaks
  html = html.replace(/\n/g, '<br/>');

  if (isStreaming) {
    html += '<span class="typing-cursor"></span>';
  }

  container.innerHTML = html;
}

function formatMathSymbols(math: string): string {
  return escapeHtml(math)
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\le(q)?/g, '≤')
    .replace(/\\ge(q)?/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\pm/g, '±')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\theta/g, 'θ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Global copy function attached to window for code snippet copy buttons
(window as any).copyCodeSnippet = function (btn: HTMLElement) {
  const codeEl = btn.closest('.code-container')?.querySelector('code');
  if (codeEl) {
    const text = codeEl.innerText;
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btn.innerText;
      btn.innerText = '✅ Copied!';
      setTimeout(() => {
        btn.innerText = originalText;
      }, 1500);
    });
  }
};

window.addEventListener('DOMContentLoaded', init);
