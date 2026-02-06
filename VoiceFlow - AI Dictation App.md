VoiceFlow - AI Dictation App
A professional speech-to-text dictation application with a web UI foundation that can be wrapped in Electron for native desktop features (global hotkeys + text injection).

1. Landing Page
A sleek, dark-themed marketing page showcasing the app:

Hero Section - "Type with your voice" headline with animated demo
Feature Highlights - Real-time transcription, 99+ languages, AI-powered accuracy
How It Works - 3-step visual: Download → Configure hotkey → Start dictating
Download Section - Platform buttons for Windows/Mac (placeholder links for now)
Pricing Tiers - Free (limited), Pro, Team plans
2. Main Dictation Interface
The core recording experience with a minimal, focused design:

Large Recording Button - Central microphone button with visual feedback 
Live Waveform Visualization - Audio wave animation while speaking
Real-time Text Display - Words appear as you speak (streaming transcription)
Quick Actions - Copy, clear, undo buttons
Status Indicator - Shows listening/processing/ready states
Keyboard Shortcut Display - Shows current hotkey (for Electron version)
3. Transcription History
Keep track of all your dictations:

Searchable List - Browse past transcriptions by date/content
Preview Cards - Show snippet, duration, word count
Copy/Delete Actions - Manage individual entries
Export Options - Download as TXT or copy all
4. Settings Panel
Customize the experience:

Language Selection - Choose from 99+ supported languages
Audio Input - Select microphone device
Transcription Mode - Real-time streaming vs. after recording
Hotkey Configuration - Set preferred keyboard shortcut (for Electron)
Theme Toggle - Dark/Light mode preference
Auto-copy Option - Automatically copy text when done
5. User Snippets (Shortcuts)
Quick text expansion like WhisperFlow has:

Create Snippets - Define trigger words and expanded text
Example: Say "sign off" → inserts "Best regards, [Your Name]"
Manage List - Edit, delete, reorder snippets
Import/Export - Backup your snippets
6. Backend Integration
Powered by Lovable Cloud + ElevenLabs:

ElevenLabs Speech-to-Text - High-accuracy transcription using Scribe v2
Real-time Streaming - WebSocket connection for live transcription
Secure API Handling - Edge functions to protect API keys
Optional User Auth - Save history and settings across devices
7. Electron-Ready Architecture
Built with desktop conversion in mind:

Modular Components - Easy to integrate with Electron's IPC
Hook-based Design - Ready for useElectronBridge integration
Event System - Prepared for global hotkey triggers
Text Output API - Ready for text injection functionality
Design Style
Dark theme with purple/blue accent colors (like WhisperFlow)
Minimal, distraction-free interface
Smooth animations and transitions
Responsive for both web and eventual desktop use

---

# Complete Guide: Wrapping a Web App in Electron for Global Hotkeys & Text Injection

## Overview

This guide explains how to take a Lovable-built web app and wrap it with Electron to achieve:
- **Global hotkey detection** (e.g., press Alt+Space from ANY app)
- **Text injection** (auto-type transcribed text into the currently focused app)
- **System tray icon** (runs in background)
- **Compile to .exe** (distributable desktop app)

---

## Prerequisites

You'll need:
- **Node.js** (v18+) installed
- **Git** installed
- Basic command line knowledge
- Your Lovable project exported to GitHub

---

## Step 1: Export Your Lovable Project

1. In Lovable, go to **Project Settings → GitHub → Connect**
2. Create a repository
3. Clone it locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   npm install
   ```

---

## Step 2: Install Electron Dependencies

```bash
npm install electron electron-builder --save-dev
npm install electron-globalshortcut robotjs node-global-key-listener --save
```

| Package | Purpose |
|---------|---------|
| `electron` | Desktop app framework |
| `electron-builder` | Package as .exe/.dmg |
| `robotjs` | Simulate keyboard typing |
| `node-global-key-listener` | Detect keys system-wide |

> ⚠️ **Note**: `robotjs` requires native compilation. You may need Python and Visual Studio Build Tools on Windows.

---

## Step 3: Create Electron Main Process

Create a file called `electron/main.js`:

```javascript
const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const robot = require('robotjs');

let mainWindow;
let tray;
let isRecording = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false, // Frameless for overlay look
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false, // Start hidden
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load your built Lovable app
  mainWindow.loadFile('dist/index.html');

  // Or load from dev server during development:
  // mainWindow.loadURL('http://localhost:8080');
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() }
  ]);
  tray.setToolTip('WhisperFlow Clone');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  // ========================================
  // GLOBAL HOTKEY REGISTRATION
  // ========================================

  // Press Alt+Space from ANYWHERE to toggle recording
  globalShortcut.register('Alt+Space', () => {
    if (!isRecording) {
      // Show window and start recording
      mainWindow.show();
      mainWindow.webContents.send('start-recording');
      isRecording = true;
    } else {
      // Stop recording
      mainWindow.webContents.send('stop-recording');
      isRecording = false;
    }
  });

  // Press Escape to cancel
  globalShortcut.register('Escape', () => {
    if (isRecording) {
      mainWindow.webContents.send('cancel-recording');
      mainWindow.hide();
      isRecording = false;
    }
  });
});

// ========================================
// TEXT INJECTION - Types into any app
// ========================================

ipcMain.on('inject-text', (event, text) => {
  // Hide our window first
  mainWindow.hide();

  // Small delay to ensure focus returns to previous app
  setTimeout(() => {
    // Type the text character by character
    robot.typeString(text);

    // OR for faster typing with special chars:
    // robot.typeStringDelayed(text, 10);
  }, 100);

  isRecording = false;
});

ipcMain.on('hide-window', () => {
  mainWindow.hide();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

---

## Step 4: Create Preload Script

Create `electron/preload.js`:

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to your web app
contextBridge.exposeInMainWorld('electronAPI', {
  // Send transcribed text to be typed
  injectText: (text) => ipcRenderer.send('inject-text', text),

  // Hide the window
  hideWindow: () => ipcRenderer.send('hide-window'),

  // Listen for recording commands from main process
  onStartRecording: (callback) => {
    ipcRenderer.on('start-recording', callback);
  },

  onStopRecording: (callback) => {
    ipcRenderer.on('stop-recording', callback);
  },

  onCancelRecording: (callback) => {
    ipcRenderer.on('cancel-recording', callback);
  }
});
```

---

## Step 5: Modify Your React App

In your Lovable React app, add this hook to handle Electron communication:

```typescript
// src/hooks/useElectronBridge.ts
import { useEffect, useCallback } from 'react';

declare global {
  interface Window {
    electronAPI?: {
      injectText: (text: string) => void;
      hideWindow: () => void;
      onStartRecording: (callback: () => void) => void;
      onStopRecording: (callback: () => void) => void;
      onCancelRecording: (callback: () => void) => void;
    };
  }
}

export function useElectronBridge(
  onStart: () => void,
  onStop: () => void,
  onCancel: () => void
) {
  const isElectron = !!window.electronAPI;

  useEffect(() => {
    if (!isElectron) return;

    window.electronAPI!.onStartRecording(onStart);
    window.electronAPI!.onStopRecording(onStop);
    window.electronAPI!.onCancelRecording(onCancel);
  }, [isElectron, onStart, onStop, onCancel]);

  const injectText = useCallback((text: string) => {
    if (isElectron) {
      window.electronAPI!.injectText(text);
    } else {
      // Fallback: copy to clipboard for web version
      navigator.clipboard.writeText(text);
    }
  }, [isElectron]);

  return { isElectron, injectText };
}
```

---

## Step 6: Update package.json

```json
{
  "name": "whisperflow-clone",
  "version": "1.0.0",
  "main": "electron/main.js",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron:dev": "npm run build && electron .",
    "electron:build": "npm run build && electron-builder",
    "postinstall": "electron-builder install-app-deps"
  },
  "build": {
    "appId": "com.yourname.whisperflow",
    "productName": "WhisperFlow Clone",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "electron/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "electron/icon.icns"
    }
  }
}
```

---

## Step 7: Build & Package

```bash
# Development (test locally)
npm run electron:dev

# Build .exe for Windows
npm run electron:build
```

Your `.exe` will be in the `release/` folder.

---

## Speech-to-Text Integration

For the actual speech recognition, you have options:

### Option A: Browser Web Speech API (Free, but limited)
```typescript
const recognition = new webkitSpeechRecognition();
recognition.continuous = true;
recognition.onresult = (event) => {
  const text = event.results[0][0].transcript;
  injectText(text);
};
recognition.start();
```

### Option B: OpenAI Whisper API (Accurate, paid)
```typescript
// Record audio, send to Whisper API, get text back
const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
  body: formData // Contains audio file
});
const { text } = await response.json();
injectText(text);
```

### Option C: ElevenLabs or Deepgram (Real-time streaming)
Better for live transcription as you speak.

---

## Complete Flow

1. User presses **Alt+Space** (from any app)
2. Electron detects global hotkey → shows overlay window
3. React app starts recording audio
4. Audio sent to Whisper/ElevenLabs API
5. Transcribed text received
6. `injectText(text)` called → Electron hides window
7. `robotjs` types text into the previously focused app
8. User sees their speech typed out!

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `robotjs` won't install | Install Visual Studio Build Tools + Python |
| Global hotkey not working | Run as administrator on Windows |
| Text not typing | Check if target app blocks simulated input |
| Slow typing | Use `typeStringDelayed` with lower delay |

---

## Resources

- [Electron Docs](https://www.electronjs.org/docs)
- [robotjs Docs](http://robotjs.io/docs)
- [electron-builder Docs](https://www.electron.build/)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)

---

**This is NOT something I can build in Lovable**, but this guide should help you (or a developer) wrap the web UI I build with the native capabilities you need.

---

Feel free to copy this entire guide! Would you like me to build the web app portion (the beautiful UI, speech recording interface, transcription history, settings) that you would then wrap with Electron?

Build the web app portion
Show simpler web-only option
Estimate Electron development cost