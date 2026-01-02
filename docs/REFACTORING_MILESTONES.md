# DevMind Refactoring & Rebuilding Plan

## Executive Summary

DevMind adalah AI-powered development environment dengan keunggulan utama: **Terminal yang terintegrasi langsung dengan Gemini CLI**. Fitur ini tidak dimiliki oleh kompetitor manapun - Cursor, Windsurf, Bolt, maupun v0.

Dokumen ini merinci rencana refactoring UI/UX untuk menciptakan pengalaman development yang seamless, responsive, dan powerful.

---

## Competitive Analysis

### Apa yang Kompetitor Punya (dan Kita Juga Harus Punya)

| Feature | Cursor | Windsurf | Bolt.new | v0 | DevMind (Target) |
|---------|--------|----------|----------|-----|------------------|
| AI Code Completion | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chat with Codebase | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-file Editing | ✅ | ✅ | ✅ | ✅ | ✅ |
| Live Preview | ❌ | ❌ | ✅ | ✅ | ✅ |
| Terminal | ✅ | ✅ | ✅ | ❌ | ✅ |
| VSCode-like Editor | ✅ | ✅ | ❌ | ❌ | ✅ |

### Apa yang HANYA DevMind Punya

| Unique Feature | Kompetitor | DevMind |
|----------------|------------|---------|
| Gemini CLI di Terminal | ❌ | ✅ |
| Natural Language Terminal Commands | ❌ | ✅ |
| AI Agent dalam Terminal Session | ❌ | ✅ |
| Multi-Provider Switching (Gemini, GPT, Claude) | Partial | ✅ |
| Terminal-to-Editor Context Bridge | ❌ | ✅ |

---

## Vision Statement

> "DevMind: Where your terminal speaks AI fluently."

Bayangkan menulis di terminal:
```bash
$ @gemini "buatkan API endpoint untuk user authentication dengan JWT"
```

Dan Gemini langsung:
1. Menganalisis project structure
2. Membuat file-file yang diperlukan
3. Mengupdate dependencies
4. Menjalankan tests
5. Memberikan penjelasan

Semua dalam satu terminal session, tanpa switching context.

---

## Design Philosophy

### 1. Terminal-First, Not Chat-First

Berbeda dengan kompetitor yang menempatkan chat panel sebagai primary interface, DevMind menempatkan **Terminal sebagai command center**.

```
┌─────────────────────────────────────────────────────────────────┐
│  DevMind Philosophy                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Kompetitor:    Chat → Code → Terminal (opsional)               │
│                                                                  │
│  DevMind:       Terminal (AI-powered) → Code → Preview          │
│                       ↑                                          │
│                 Command Center                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Fluid Responsive Design

Bukan sekadar "mobile-friendly", tapi **context-aware adaptation**:

- **Mobile (< 640px)**: Terminal-only mode dengan swipe gestures
- **Tablet (640-1024px)**: Split view dengan collapsible panels
- **Desktop (1024-1440px)**: Full IDE experience
- **Ultra-wide (> 1440px)**: Multi-column dengan floating panels

### 3. Zero-Friction AI Integration

AI bukan add-on, tapi **native citizen** di setiap interaksi:
- Hover untuk explanation
- Select untuk refactor
- Error untuk auto-fix
- Terminal untuk generation

---

## Milestone Breakdown

---

## Phase 1: Foundation Rebuild

### Milestone 1.1: Design System & Theming

**Duration**: 1 minggu

**Objective**: Membangun design system yang konsisten dan themeable

#### Design Tokens

```css
/* Color System - Dark Mode First */
--dm-bg-primary: #0a0a0b;        /* Main background */
--dm-bg-secondary: #111113;      /* Panel background */
--dm-bg-tertiary: #1a1a1d;       /* Card/elevated */
--dm-bg-hover: #252529;          /* Interactive hover */

--dm-border-subtle: #27272a;     /* Subtle borders */
--dm-border-default: #3f3f46;    /* Default borders */
--dm-border-focus: #6366f1;      /* Focus state */

--dm-text-primary: #fafafa;      /* Primary text */
--dm-text-secondary: #a1a1aa;    /* Secondary text */
--dm-text-muted: #71717a;        /* Muted/disabled */

--dm-accent-primary: #6366f1;    /* Indigo - primary actions */
--dm-accent-success: #22c55e;    /* Green - success states */
--dm-accent-warning: #f59e0b;    /* Amber - warnings */
--dm-accent-error: #ef4444;      /* Red - errors */
--dm-accent-gemini: #4285f4;     /* Google Blue - Gemini */

/* Typography Scale */
--dm-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
--dm-font-sans: 'Inter', system-ui, sans-serif;

--dm-text-xs: 0.75rem;           /* 12px */
--dm-text-sm: 0.875rem;          /* 14px */
--dm-text-base: 1rem;            /* 16px */
--dm-text-lg: 1.125rem;          /* 18px */

/* Spacing Scale */
--dm-space-1: 0.25rem;           /* 4px */
--dm-space-2: 0.5rem;            /* 8px */
--dm-space-3: 0.75rem;           /* 12px */
--dm-space-4: 1rem;              /* 16px */
--dm-space-6: 1.5rem;            /* 24px */
--dm-space-8: 2rem;              /* 32px */

/* Border Radius */
--dm-radius-sm: 0.25rem;         /* 4px */
--dm-radius-md: 0.5rem;          /* 8px */
--dm-radius-lg: 0.75rem;         /* 12px */
--dm-radius-full: 9999px;        /* Pill */

/* Shadows */
--dm-shadow-sm: 0 1px 2px rgba(0,0,0,0.4);
--dm-shadow-md: 0 4px 6px rgba(0,0,0,0.4);
--dm-shadow-lg: 0 10px 15px rgba(0,0,0,0.5);
--dm-shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);

/* Animation */
--dm-transition-fast: 150ms ease;
--dm-transition-base: 200ms ease;
--dm-transition-slow: 300ms ease;
```

#### Component Library

Bangun komponen primitif:
- `Button` - Primary, Secondary, Ghost, Danger variants
- `Input` - Text, Search, Command variants  
- `Panel` - Collapsible, Resizable, Floating
- `Tabs` - Horizontal, Vertical, Closable
- `Tooltip` - Hover, Click, AI-enhanced
- `ContextMenu` - Right-click menus
- `CommandPalette` - Cmd+K interface
- `Toast` - Notifications

#### Deliverables

- [ ] `styles/design-tokens.css` - CSS custom properties
- [ ] `components/ui/` - Primitive components
- [ ] `hooks/useTheme.ts` - Theme management
- [ ] Storybook documentation (optional)

---

### Milestone 1.2: Responsive Layout Architecture

**Duration**: 1.5 minggu

**Objective**: Layout system yang fluid di semua device

#### Layout Modes

```
┌─────────────────────────────────────────────────────────────────┐
│ DESKTOP (> 1024px)                                              │
├────┬───────────────────────┬────────────────────┬───────────────┤
│    │                       │                    │               │
│ A  │      EDITOR           │     PREVIEW        │    CHAT       │
│ C  │    (code-server)      │                    │   (optional)  │
│ T  │                       │                    │               │
│ I  ├───────────────────────┴────────────────────┤               │
│ V  │                                            │               │
│ I  │              TERMINAL                      │               │
│ T  │         (Gemini CLI integrated)            │               │
│ Y  │                                            │               │
├────┴────────────────────────────────────────────┴───────────────┤
│                         STATUS BAR                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ TABLET (640-1024px)                                             │
├────┬────────────────────────────────────────────────────────────┤
│    │                                                            │
│ A  │               EDITOR / PREVIEW (tabs)                      │
│ C  │                                                            │
│ T  ├────────────────────────────────────────────────────────────┤
│    │                                                            │
│    │                     TERMINAL                               │
│    │                                                            │
├────┴────────────────────────────────────────────────────────────┤
│  [Files] [Search] [AI] [Settings]          STATUS               │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────┐
│ MOBILE (< 640px)          │
├───────────────────────────┤
│                           │
│                           │
│        TERMINAL           │
│    (Full Screen Mode)     │
│                           │
│                           │
├───────────────────────────┤
│  ← swipe for panels →     │
├───────────────────────────┤
│ [Term] [Code] [Preview]   │
└───────────────────────────┘
```

#### Panel System Features

1. **Drag-to-Resize**
   - Minimum/maximum constraints
   - Snap-to-grid (25%, 50%, 75%)
   - Double-click to reset

2. **Collapse/Expand**
   - Smooth animation
   - Keyboard shortcuts (Cmd+B, Cmd+J)
   - Remember user preference

3. **Floating Mode**
   - Detach any panel
   - Picture-in-picture preview
   - Multi-monitor support (future)

4. **Mobile Gestures**
   - Swipe left/right untuk panel switching
   - Pull down untuk command palette
   - Long press untuk context menu

#### Deliverables

- [ ] `components/layout/WorkbenchLayout.tsx` - Main container
- [ ] `components/layout/Panel.tsx` - Resizable panel
- [ ] `components/layout/PanelGroup.tsx` - Panel orchestrator
- [ ] `components/layout/MobileNav.tsx` - Bottom navigation
- [ ] `hooks/useResponsive.ts` - Breakpoint detection
- [ ] `hooks/usePanelLayout.ts` - Layout state management

---

## Phase 2: Core Features Rebuild

### Milestone 2.1: Code-Server Integration

**Duration**: 2 minggu

**Objective**: Replace Monaco dengan full VSCode experience via code-server

#### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DevMind Client                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐    WebSocket    ┌─────────────────────┐   │
│  │                 │◄───────────────►│                     │   │
│  │  CodeServer     │                 │   code-server       │   │
│  │  Frame          │    File Sync    │   (Docker/Native)   │   │
│  │  (iframe)       │◄───────────────►│                     │   │
│  │                 │                 │   - VSCode Engine   │   │
│  └─────────────────┘                 │   - Extensions      │   │
│          │                           │   - LSP Support     │   │
│          │                           └─────────────────────┘   │
│          │                                     │                │
│          │ Commands                            │                │
│          ▼                                     │                │
│  ┌─────────────────┐                          │                │
│  │  Command Bridge │◄─────────────────────────┘                │
│  │                 │                                            │
│  │  - Open file    │         ┌─────────────────────┐           │
│  │  - Navigate     │◄───────►│  Virtual File       │           │
│  │  - Get content  │         │  System (VFS)       │           │
│  │  - Apply diff   │         └─────────────────────┘           │
│  └─────────────────┘                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Integration Approach

**Option A: Embedded code-server (Recommended)**
- Run code-server sebagai service
- Embed via iframe dengan custom styling
- Communicate via postMessage API

**Option B: Monaco dengan VSCode Extensions**
- Keep Monaco editor
- Add LSP support via monaco-languageclient
- Limited extension compatibility

**Option C: Hybrid (Fallback)**
- code-server untuk desktop
- Monaco/CodeMirror untuk mobile

#### Key Features to Implement

1. **Seamless File Sync**
   ```typescript
   interface FileSync {
     // Watch VFS changes → update code-server
     onVFSChange(path: string, content: string): void;
     
     // Watch code-server changes → update VFS
     onEditorChange(path: string, content: string): void;
     
     // Conflict resolution
     resolveConflict(path: string): Promise<Resolution>;
   }
   ```

2. **AI Extension Slot**
   - Custom extension untuk inline completions
   - Hook ke DevMind AI providers
   - Ghost text rendering

3. **Theme Synchronization**
   - DevMind theme → code-server theme
   - Real-time sync

4. **Command Forwarding**
   ```typescript
   // Dari terminal ke editor
   terminal.execute('@gemini edit app.tsx "add error handling"');
   // → Opens file, highlights changes, shows diff
   ```

#### Mobile Fallback

Untuk mobile, gunakan CodeMirror 6:
- Lightweight (~100KB vs ~2MB Monaco)
- Touch-optimized
- Basic syntax highlighting
- Minimal features (read-heavy, light editing)

#### Deliverables

- [ ] `components/editor/CodeServerFrame.tsx` - iframe wrapper
- [ ] `components/editor/MobileEditor.tsx` - CodeMirror fallback
- [ ] `services/codeServerBridge.ts` - Communication layer
- [ ] `services/fileSync.ts` - Bidirectional sync
- [ ] `hooks/useCodeServer.ts` - React integration
- [ ] Docker configuration untuk code-server

---

### Milestone 2.2: Terminal Revolution (USP)

**Duration**: 2 minggu

**Objective**: Terminal sebagai AI command center - fitur pembeda utama DevMind

#### Vision

Terminal bukan lagi sekadar "tempat menjalankan commands", tapi **AI-powered command center** yang memahami context, bisa berdialog, dan mengeksekusi tasks kompleks.

#### Command Syntax Design

```bash
# Standard shell commands tetap work
$ npm install
$ git status
$ ls -la

# AI Commands dengan @ prefix
$ @gemini "jelaskan error ini"
$ @gemini fix                    # Auto-fix last error
$ @gemini generate "user model with prisma"
$ @gemini refactor app.tsx       # Refactor entire file
$ @gemini test                   # Generate tests for recent changes
$ @gemini commit                 # Smart commit message

# Context-aware shortcuts
$ @explain                       # Explain last output
$ @fix                          # Fix last error (alias)
$ @undo                         # Undo last AI action

# Multi-provider commands
$ @gpt "compare this with gemini's solution"
$ @claude "review this code"

# Pipeline commands
$ npm test | @gemini "analyze failures and suggest fixes"
$ git diff | @gemini "write commit message"
$ cat error.log | @gemini "find root cause"

# Interactive mode
$ @gemini
┌─────────────────────────────────────────┐
│ 🤖 Gemini Interactive Mode              │
│                                         │
│ You: buatkan CRUD API untuk products    │
│                                         │
│ Gemini: Saya akan membuatkan CRUD API.  │
│ Berikut yang akan saya lakukan:         │
│                                         │
│ 1. Create /api/products/route.ts        │
│ 2. Create /lib/db/products.ts           │
│ 3. Update /types/index.ts               │
│                                         │
│ Lanjutkan? [Y/n/edit]                   │
│                                         │
│ You: Y                                  │
│                                         │
│ ✓ Created api/products/route.ts         │
│ ✓ Created lib/db/products.ts            │
│ ✓ Updated types/index.ts                │
│                                         │
│ Selesai! Test dengan:                   │
│ $ curl localhost:3000/api/products      │
│                                         │
│ [exit] untuk keluar interactive mode    │
└─────────────────────────────────────────┘
```

#### Terminal UI Redesign

```
┌─────────────────────────────────────────────────────────────────┐
│ TERMINAL ─────────────────────────────────── [+] [⋮] [□] [×]   │
├─────────────────────────────────────────────────────────────────┤
│ ┌─ zsh ──┐ ┌─ node ──┐ ┌─ @gemini ──┐                          │
│ └────────┘ └─────────┘ └────────────┘ [+]                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ~/devmind $ npm run dev                                        │
│                                                                  │
│  > devmind@1.0.0 dev                                            │
│  > next dev                                                     │
│                                                                  │
│  ▲ Next.js 14.0.0                                               │
│  - Local:        http://localhost:3000                          │
│  - Network:      http://192.168.1.100:3000                     │
│                                                                  │
│  ✓ Ready in 2.3s                                                │
│                                                                  │
│  ~/devmind $ @gemini "tambahkan dark mode toggle"               │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🤖 Analyzing project structure...                        │   │
│  │                                                          │   │
│  │ Found: Next.js 14 with Tailwind CSS                     │   │
│  │ Theme system: Not detected                               │   │
│  │                                                          │   │
│  │ I'll create a dark mode toggle using next-themes:       │   │
│  │                                                          │   │
│  │ ┌─ Changes ─────────────────────────────────────────┐   │   │
│  │ │ + lib/theme-provider.tsx         (new)            │   │   │
│  │ │ + components/theme-toggle.tsx    (new)            │   │   │
│  │ │ ~ app/layout.tsx                 (modified)       │   │   │
│  │ │ ~ tailwind.config.js             (modified)       │   │   │
│  │ └───────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │ [Apply All] [Review Changes] [Cancel]                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ~/devmind $ █                                                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ [@gemini] [↑↓ history] [Tab autocomplete]    gemini-1.5-pro    │
└─────────────────────────────────────────────────────────────────┘
```

#### Key Features

1. **Context Injection**
   ```typescript
   interface TerminalContext {
     currentDirectory: string;
     openFiles: string[];
     selectedText?: string;
     lastOutput: string;
     lastError?: Error;
     gitStatus?: GitStatus;
     runningProcesses: Process[];
   }
   
   // Auto-injected ke setiap AI command
   const enhancedPrompt = injectContext(userPrompt, context);
   ```

2. **Smart Autocomplete**
   - File paths dengan fuzzy search
   - Git branches
   - npm scripts
   - AI command suggestions
   - History-based predictions

3. **Output Enhancement**
   - Syntax highlighting untuk code blocks
   - Collapsible long outputs
   - Clickable file paths (buka di editor)
   - Clickable URLs
   - Error highlighting dengan quick-fix button

4. **Multi-Tab Support**
   - Named tabs
   - Tab dengan running process indicator
   - Drag to reorder
   - Split horizontal/vertical

5. **Session Persistence**
   - Auto-save command history
   - Restore tabs on reload
   - Share session (collaboration)

#### Deliverables

- [ ] `components/terminal/TerminalCore.tsx` - Main terminal component
- [ ] `components/terminal/TerminalTabs.tsx` - Tab management
- [ ] `components/terminal/TerminalOutput.tsx` - Enhanced output rendering
- [ ] `components/terminal/AIResponseCard.tsx` - AI response UI
- [ ] `components/terminal/CommandInput.tsx` - Smart input with autocomplete
- [ ] `services/terminalAI.ts` - AI command processor
- [ ] `services/contextInjector.ts` - Context gathering
- [ ] `hooks/useTerminal.ts` - Terminal state management
- [ ] `lib/gemini-cli.ts` - Gemini CLI integration

---

### Milestone 2.3: Multi-Provider AI System

**Duration**: 1.5 minggu

**Objective**: Unified AI interface dengan multiple provider support

#### Provider Architecture

```typescript
// Abstract provider interface
interface AIProvider {
  id: string;
  name: string;
  icon: string;
  models: Model[];
  
  // Core capabilities
  complete(prompt: string, options?: CompletionOptions): AsyncGenerator<string>;
  chat(messages: Message[], options?: ChatOptions): AsyncGenerator<string>;
  
  // Optional capabilities
  embeddings?(text: string): Promise<number[]>;
  vision?(image: Blob, prompt: string): AsyncGenerator<string>;
  
  // Provider-specific
  getUsage(): Promise<Usage>;
  validateApiKey(): Promise<boolean>;
}

// Supported providers
const providers = {
  gemini: new GeminiProvider(),
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  groq: new GroqProvider(),
  ollama: new OllamaProvider(), // Local models
};
```

#### Features

1. **Provider Switcher**
   - Quick switch via status bar
   - Per-task provider selection
   - Keyboard shortcut (Cmd+Shift+P)

2. **Smart Routing**
   ```typescript
   // Auto-select best provider for task
   const router = new AIRouter({
     coding: 'gemini',      // Best for code
     explanation: 'claude', // Best for explanation
     quick: 'groq',        // Fastest
     local: 'ollama',      // Privacy-first
   });
   ```

3. **Fallback Chain**
   ```typescript
   // If primary fails, try fallback
   const response = await ai.complete(prompt, {
     provider: 'gemini',
     fallback: ['openai', 'anthropic'],
   });
   ```

4. **Cost Tracking**
   - Token usage per provider
   - Estimated cost
   - Usage limits/alerts

#### Deliverables

- [ ] `services/ai/AIProvider.ts` - Abstract interface
- [ ] `services/ai/providers/` - Provider implementations
- [ ] `services/ai/AIRouter.ts` - Smart routing
- [ ] `services/ai/UsageTracker.ts` - Cost tracking
- [ ] `components/ai/ProviderSelector.tsx` - UI component
- [ ] `hooks/useAI.ts` - React hook

---

## Phase 3: Enhanced Experience

### Milestone 3.1: Intelligent Copilot

**Duration**: 1.5 minggu

**Objective**: AI assistance yang terintegrasi di setiap aspek coding

#### Features

1. **Inline Completions (Ghost Text)**
   ```
   function calculateTotal(items) {
     return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
     ↑ Ghost text: "// Add tax calculation"
     Press Tab to accept, Esc to dismiss
   ```

2. **Hover Explanations**
   - Hover pada function → explanation
   - Hover pada error → suggested fix
   - Hover pada import → documentation

3. **Selection Actions**
   - Select code → floating menu
   - Options: Explain, Refactor, Add Tests, Add Comments, Fix

4. **Error Quick Fix**
   - Red squiggle dengan AI-powered fixes
   - One-click apply
   - Multiple suggestions ranked by confidence

5. **Commit Message Generation**
   - Analyze staged changes
   - Generate conventional commit message
   - Multi-language support

#### Deliverables

- [ ] `components/copilot/InlineCompletion.tsx`
- [ ] `components/copilot/HoverCard.tsx`
- [ ] `components/copilot/SelectionMenu.tsx`
- [ ] `components/copilot/QuickFix.tsx`
- [ ] `services/copilot/CompletionEngine.ts`
- [ ] `hooks/useCopilot.ts`

---

### Milestone 3.2: Chat & Agent Interface

**Duration**: 1 minggu

**Objective**: Redesign chat interface untuk better collaboration dengan AI

#### UI Design

```
┌─────────────────────────────────────────────────────────────────┐
│ AI ASSISTANT ──────────────────────────── [@gemini ▼] [⚙] [×]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Today                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─ You ────────────────────────────────────────── 10:30 AM ─┐ │
│  │ Buatkan form login dengan validasi email dan password     │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Gemini ─────────────────────────────────────── 10:30 AM ─┐ │
│  │                                                            │ │
│  │ Saya akan membuat form login dengan fitur:                │ │
│  │ • Email validation                                        │ │
│  │ • Password strength indicator                             │ │
│  │ • Error messages                                          │ │
│  │                                                            │ │
│  │ ┌─ components/login-form.tsx ──────────────────────────┐ │ │
│  │ │ 'use client'                                          │ │ │
│  │ │                                                        │ │ │
│  │ │ import { useState } from 'react'                      │ │ │
│  │ │ import { Button } from '@/components/ui/button'       │ │ │
│  │ │ ...                                                   │ │ │
│  │ └──────────────────────────────────────────────────────┘ │ │
│  │ [Copy] [Apply] [Open in Editor] [Show Diff]              │ │
│  │                                                            │ │
│  │ ┌─ Tool: create_file ──────────────────────────────────┐ │ │
│  │ │ ✓ Created components/login-form.tsx                   │ │ │
│  │ └──────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │ Form sudah dibuat! Preview di browser untuk melihat      │ │
│  │ hasilnya.                                                 │ │
│  │                                                            │ │
│  │ [👍] [👎] [Regenerate]                                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ Ask anything... (@ to mention files)                        ││
│ │                                                   [📎] [➤] ││
│ └─────────────────────────────────────────────────────────────┘│
│ [login-form.tsx] [app/page.tsx] ─ Context files               │
└─────────────────────────────────────────────────────────────────┘
```

#### Features

1. **File Mentions**
   - `@filename` untuk add context
   - Autocomplete file names
   - Preview on hover

2. **Code Block Actions**
   - Copy with one click
   - Apply to file
   - Show diff before applying
   - Open in editor

3. **Tool Execution Visualization**
   - Real-time progress
   - Expandable details
   - Retry on failure

4. **Conversation Management**
   - Save/load conversations
   - Branch conversations
   - Share conversations

5. **Voice Input**
   - Web Speech API integration
   - Push-to-talk atau continuous
   - Visual feedback

#### Deliverables

- [ ] `components/chat/ChatPanel.tsx` - Main container
- [ ] `components/chat/MessageBubble.tsx` - Message rendering
- [ ] `components/chat/CodeBlock.tsx` - Enhanced code blocks
- [ ] `components/chat/ToolExecution.tsx` - Tool visualization
- [ ] `components/chat/FileContext.tsx` - Context management
- [ ] `components/chat/VoiceInput.tsx` - Voice support
- [ ] `hooks/useChat.ts` - Chat state

---

### Milestone 3.3: Preview & DevTools

**Duration**: 1 minggu

**Objective**: Enhanced preview dengan responsive testing dan debugging

#### Features

1. **Responsive Preview Modes**
   ```
   [iPhone 14] [iPad] [Desktop] [Custom] [Responsive ↔]
   ```

2. **Device Frames**
   - Realistic device mockups
   - Notch, status bar simulation
   - Orientation toggle

3. **Console Panel**
   - Console.log output
   - Error/warning filtering
   - Object inspection

4. **Element Inspector**
   - Hover to highlight
   - Click to select
   - Style editing (limited)

5. **Screenshot & Export**
   - Capture current view
   - Export as PNG/SVG
   - Share link

#### Deliverables

- [ ] `components/preview/PreviewFrame.tsx`
- [ ] `components/preview/DeviceSelector.tsx`
- [ ] `components/preview/ConsolePanel.tsx`
- [ ] `components/preview/Inspector.tsx`
- [ ] `hooks/usePreview.ts`

---

## Phase 4: Polish & Optimization

### Milestone 4.1: Performance & Loading

**Duration**: 1 minggu

**Tasks**:
- Code splitting dengan dynamic imports
- Skeleton loading states
- Virtual scrolling untuk file lists
- Service Worker untuk offline support
- Asset optimization

### Milestone 4.2: Keyboard & Accessibility

**Duration**: 0.5 minggu

**Tasks**:
- Command Palette (Cmd+K)
- Keyboard shortcuts untuk semua actions
- Focus management
- Screen reader support
- High contrast mode

### Milestone 4.3: Onboarding & Help

**Duration**: 0.5 minggu

**Tasks**:
- Interactive tour
- Tooltip hints
- Keyboard shortcut overlay (Cmd+/)
- Documentation integration

---

## Technical Architecture

### Directory Structure (Target)

```
devmind/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # Primitive components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── panel.tsx
│   │   └── ...
│   ├── layout/                # Layout components
│   │   ├── WorkbenchLayout.tsx
│   │   ├── Panel.tsx
│   │   ├── PanelGroup.tsx
│   │   └── MobileNav.tsx
│   ├── editor/                # Code editor
│   │   ├── CodeServerFrame.tsx
│   │   ├── MobileEditor.tsx
│   │   └── EditorTabs.tsx
│   ├── terminal/              # Terminal (USP)
│   │   ├── TerminalCore.tsx
│   │   ├── TerminalTabs.tsx
│   │   ├── TerminalOutput.tsx
│   │   ├── AIResponseCard.tsx
│   │   └── CommandInput.tsx
│   ├── chat/                  # Chat interface
│   │   ├── ChatPanel.tsx
│   │   ├── MessageBubble.tsx
│   │   └── CodeBlock.tsx
│   ├── copilot/               # AI copilot
│   │   ├── InlineCompletion.tsx
│   │   ├── HoverCard.tsx
│   │   └── QuickFix.tsx
│   ├── preview/               # Preview pane
│   │   ├── PreviewFrame.tsx
│   │   └── DeviceSelector.tsx
│   └── common/                # Shared components
│       ├── CommandPalette.tsx
│       └── Tooltip.tsx
├── services/
│   ├── ai/                    # AI providers
│   │   ├── AIProvider.ts
│   │   ├── AIRouter.ts
│   │   └── providers/
│   │       ├── gemini.ts
│   │       ├── openai.ts
│   │       └── anthropic.ts
│   ├── terminal/              # Terminal services
│   │   ├── terminalAI.ts
│   │   └── contextInjector.ts
│   ├── editor/                # Editor services
│   │   ├── codeServerBridge.ts
│   │   └── fileSync.ts
│   └── vfs/                   # Virtual file system
│       └── virtualFileSystem.ts
├── hooks/
│   ├── useAI.ts
│   ├── useTerminal.ts
│   ├── useCodeServer.ts
│   ├── useResponsive.ts
│   └── usePanelLayout.ts
├── lib/
│   ├── gemini-cli.ts          # Gemini CLI core
│   └── utils.ts
├── styles/
│   ├── design-tokens.css
│   └── themes/
│       ├── dark.css
│       └── light.css
└── types/
    └── index.ts
```

---

## Timeline Summary

| Phase | Milestone | Duration | Cumulative |
|-------|-----------|----------|------------|
| **1** | Design System | 1 week | Week 1 |
| **1** | Responsive Layout | 1.5 weeks | Week 2.5 |
| **2** | Code-Server Integration | 2 weeks | Week 4.5 |
| **2** | Terminal Revolution (USP) | 2 weeks | Week 6.5 |
| **2** | Multi-Provider AI | 1.5 weeks | Week 8 |
| **3** | Intelligent Copilot | 1.5 weeks | Week 9.5 |
| **3** | Chat Interface | 1 week | Week 10.5 |
| **3** | Preview & DevTools | 1 week | Week 11.5 |
| **4** | Performance | 1 week | Week 12.5 |
| **4** | Accessibility | 0.5 week | Week 13 |
| **4** | Onboarding | 0.5 week | Week 13.5 |

**Total Estimated Duration**: 13-14 minggu (3.5 bulan)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| code-server complexity | High | Start dengan Monaco fallback, iterate |
| Performance on mobile | Medium | Aggressive lazy loading, CodeMirror fallback |
| AI API costs | Medium | Usage limits, caching, local models |
| Browser compatibility | Low | Modern browsers only, Safari quirks |
| WebContainer limitations | Medium | Hybrid approach dengan code-server |

---

## Success Metrics

1. **Performance**
   - First Contentful Paint < 1.5s
   - Time to Interactive < 3s
   - Lighthouse score > 90

2. **User Experience**
   - Terminal AI commands/session > 5 (engagement)
   - Session duration > 15 minutes
   - Return rate > 40%

3. **Technical**
   - Zero critical bugs
   - 80%+ test coverage pada core features
   - Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

---

## Next Steps

1. **Review & Approval** - Diskusi tim untuk finalisasi scope
2. **Design Mockups** - High-fidelity mockups untuk key screens
3. **Technical Spike** - PoC untuk code-server integration
4. **Sprint Planning** - Break down ke sprint 2-minggu

---

*Document Version: 1.0*
*Last Updated: January 2, 2026*
*Author: DevMind Team*
