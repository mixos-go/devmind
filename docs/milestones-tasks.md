# Milestones → PR-sized Tasks

This file breaks down the high-level milestones from `MILESTONES.md` and `REFACTORING_MILESTONES.md` into small, reviewable tasks (PR-sized). Use these as the canonical checklist when implementing features.

## Phase 1 — SDK (Priority)

- [ ] 1.1.1 Create `sdk/__tests__/client.spec.ts` — basic client construction tests
- [ ] 1.1.2 Add `sdk/config` validation unit tests and edge cases
- [ ] 1.1.3 Implement streaming smoke-test that uses `LLMClient.stream` with a mocked provider
- [ ] 1.1.4 Add `tools/registry` minimal test and example tool for local development
- [ ] 1.1.5 Add documentation: `sdk/README.md` with usage examples

### Provider Implementations (split per PR)

- [ ] 1.2.1 GeminiProvider POC: implement `stream()` stub + unit tests
- [ ] 1.2.2 GeminiProvider: tool-calling integration + example tool
- [ ] 1.3.1 OpenAIProvider POC: streaming wrapper + tests
- [ ] 1.3.2 OpenAIProvider: function-calling mapping tests
- [ ] 1.4.1 AnthropicProvider POC: streaming + tests
- [ ] 1.5.1 OllamaProvider POC: local model detection + tests

## Phase 2 — Knowledge Base & RAG

- [ ] 2.1.1 Create `knowledge/__tests__/indexer.spec.ts` — indexer tests
- [ ] 2.1.2 Implement `knowledge/indexer` integration with `knowledge/markdownParser`
- [ ] 2.2.1 Add markdown loader that extracts frontmatter and code blocks
- [ ] 2.2.2 Build simple semantic search shim (pluggable to vector DB later)

## Phase 3 — WebContainer Runtime

- [ ] 3.1.1 Add runtime unit tests for boot/teardown (mocking `@webcontainer/api`)
- [ ] 3.1.2 Add tests for `mountFromVirtualFS` and file operations
- [ ] 3.2.1 Add integration test for `installPackages` using a small package

## Phase 4 — Gemini CLI Integration

- [ ] 4.1.1 Add `lib/gemini-cli.ts` helpers (parser + runner) — POC
- [ ] 4.1.2 Add CLI command parser tests (`cli/commandParser.test.ts`) and examples

---

# Refactoring — Deliverable Tasks

These are the refactor tasks from `REFACTORING_MILESTONES.md` split into smaller steps.

## Design System & Theming

- [ ] R1.1 Create `styles/design-tokens.css` (tokens) — DONE
- [ ] R1.2 Add primitive components in `components/ui/*` — DONE (skeletons)
- [ ] R1.3 Add `hooks/useTheme.ts` and theme switcher integration

## Responsive Layout

- [ ] R2.1 Implement `components/layout/WorkbenchLayout.tsx` (basic panels) — DONE (skeleton)
- [ ] R2.2 Implement `components/layout/Panel.tsx` resizable API (small PR)
- [ ] R2.3 Mobile navigation & gestures (small PR)

## Editor Strategy (code-server PoC)

- [ ] E1.1 Add `components/editor/CodeServerFrame.tsx` PoC — DONE (skeleton)
- [ ] E1.2 Add `services/codeServerBridge.ts` start/stop helpers — DONE (skeleton)
- [ ] E1.3 Add `services/fileSync.ts` and create small integration test

## Terminal (USP)

- [ ] T1.1 Create `components/terminal/TerminalCore.tsx` and input component — DONE (skeleton)
- [ ] T1.2 Implement `services/terminalAI.ts` command routing (POC) — DONE (skeleton)
- [ ] T1.3 Add `services/contextInjector.ts` (collects cwd/open files/last output)

## Copilot, Chat & Preview

- [ ] C1.1 Expand `components/chat/ChatPanel.tsx` to support file mentions
- [ ] C1.2 Implement `components/copilot/InlineCompletion.tsx` (PoC)
- [ ] P1.1 Add `components/preview/PreviewFrame.tsx` with device selector

---

Notes:
- Tasks marked DONE were created as skeletons in the initial pass to avoid duplication.
- Keep PRs small and focused (single responsibility). Link PRs to these task lines in their descriptions.
