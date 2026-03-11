# UI Replication Plugin Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an MVP Chrome extension that lets a user select a webpage module, inspect extracted structure, preview the normalized interpretation, and send it to an LLM for maintainable code rewrite.

**Architecture:** The implementation is extension-first and schema-centered. Build stable selection and extraction in the page context, normalize the results into a shared schema, render the same schema in the panel preview, and only then add rewrite/export capability. The plan keeps preview and rewrite coupled to one normalized data contract so the system stays explainable and debuggable.

**Tech Stack:** Chrome extension runtime, TypeScript, React UI for panel, shared schema/types, browser DevTools-compatible extraction techniques, LLM API integration chosen during implementation

---

## Chunk 1: Extension Skeleton and Shared Contracts

### Task 1: Add extension app structure

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/src/background/index.ts`
- Create: `extension/src/content/index.ts`
- Create: `extension/src/panel/index.tsx`
- Create: `extension/src/shared/`
- Test: extension build boots with placeholder entrypoints

- [ ] **Step 1: Write the failing expectation**

The repo should contain an isolated extension workspace with background, content, panel, and shared entrypoints.

- [ ] **Step 2: Verify it is missing**

Run: `rg --files extension`
Expected: no extension workspace exists

- [ ] **Step 3: Create the minimal structure**

Add the manifest and placeholder runtime entry files with enough wiring to establish:

- one content script
- one background worker
- one panel UI entry
- one shared folder for future contracts

- [ ] **Step 4: Verify structure**

Run: `find extension -maxdepth 3 -type f | sort`
Expected: the workspace shows the new extension runtime boundaries

- [ ] **Step 5: Commit**

```bash
git add extension
git commit -m "feat: scaffold UI replication extension"
```

### Task 2: Define shared message and schema contracts

**Files:**
- Create: `extension/src/shared/messages.ts`
- Create: `extension/src/shared/schema.ts`
- Create: `extension/src/shared/status.ts`
- Test: type-check imports compile cleanly

- [ ] **Step 1: Write the failing expectation**

Selection, extraction, preview, and rewrite should share a common contract instead of ad hoc message payloads.

- [ ] **Step 2: Verify it does not exist**

Run: `rg -n "SelectionSnapshot|NormalizedBlock|RewriteRequest" extension/src`
Expected: no shared contracts exist

- [ ] **Step 3: Add the contracts**

Define:

- runtime message types
- phase/status enums
- `SelectionSnapshot`
- `ExtractedTree`
- `NormalizedBlock`
- `RewriteRequest`

Keep the first version focused on MVP fields only.

- [ ] **Step 4: Verify the contracts**

Run: `sed -n '1,260p' extension/src/shared/schema.ts`
Expected: the schema clearly separates selection, extraction, normalization, and rewrite input

- [ ] **Step 5: Commit**

```bash
git add extension/src/shared
git commit -m "feat: add extension schema and message contracts"
```

## Chunk 2: Selection and Extraction

### Task 3: Implement candidate selection overlay

**Files:**
- Create: `extension/src/core/selector/scoreCandidate.ts`
- Create: `extension/src/core/selector/findSelectableRoot.ts`
- Create: `extension/src/content/overlay.ts`
- Modify: `extension/src/content/index.ts`
- Test: manual extension run on a sample page

- [ ] **Step 1: Write the failing test or expectation**

The content script should highlight stable module candidates instead of raw leaf elements.

- [ ] **Step 2: Verify missing behavior**

Run: manual smoke test in the browser after loading the extension
Expected: no selectable overlay behavior exists yet

- [ ] **Step 3: Implement minimal selection**

Add:

- candidate scoring rules
- parent escalation logic
- overlay rendering
- click-to-freeze selection behavior

Keep the MVP rules simple and explainable.

- [ ] **Step 4: Verify behavior**

Run: manual browser test on 2-3 representative pages
Expected: highlight remains stable on meaningful containers

- [ ] **Step 5: Commit**

```bash
git add extension/src/core/selector extension/src/content
git commit -m "feat: add module selection overlay"
```

### Task 4: Implement raw extraction

**Files:**
- Create: `extension/src/core/extractor/extractTree.ts`
- Create: `extension/src/core/extractor/readComputedStyles.ts`
- Create: `extension/src/core/extractor/captureSelection.ts`
- Modify: `extension/src/content/index.ts`
- Test: one serialized extraction sample per selected block

- [ ] **Step 1: Write the failing expectation**

After selection, the extension should capture a raw snapshot containing structure, styles, bounds, and screenshot references.

- [ ] **Step 2: Verify missing behavior**

Run: manual selection flow
Expected: selection produces no structured snapshot yet

- [ ] **Step 3: Implement raw extraction**

Capture:

- selected root metadata
- simplified node tree
- critical computed styles
- bounds
- text and resource refs
- screenshot reference or capture token

- [ ] **Step 4: Verify extraction**

Run: save one extraction payload locally in dev mode and inspect it
Expected: payload is readable and not a raw DOM dump

- [ ] **Step 5: Commit**

```bash
git add extension/src/core/extractor extension/src/content
git commit -m "feat: add raw block extraction"
```

## Chunk 3: Normalization and Preview

### Task 5: Normalize extraction output

**Files:**
- Create: `extension/src/core/normalizer/normalizeBlock.ts`
- Create: `extension/src/core/normalizer/extractTokens.ts`
- Modify: `extension/src/shared/schema.ts`
- Test: one fixture-style normalization pass

- [ ] **Step 1: Write the failing test or expectation**

Raw extraction should be transformed into a stable `NormalizedBlock` for all downstream consumers.

- [ ] **Step 2: Verify the gap**

Run: inspect extraction output
Expected: output is too page-shaped to serve preview and rewrite directly

- [ ] **Step 3: Implement normalization**

Map raw extraction into:

- layout groups
- content nodes
- asset nodes
- decoration nodes
- state hints
- motion hints
- design tokens
- confidence markers

- [ ] **Step 4: Verify normalization**

Run: inspect one normalized payload
Expected: payload reads like product data, not browser internals

- [ ] **Step 5: Commit**

```bash
git add extension/src/core/normalizer extension/src/shared/schema.ts
git commit -m "feat: add normalized block schema mapping"
```

### Task 6: Render preview from normalized data

**Files:**
- Create: `extension/src/core/preview/mapToPreviewModel.ts`
- Create: `extension/src/panel/components/PreviewCanvas.tsx`
- Create: `extension/src/panel/components/InspectionSummary.tsx`
- Modify: `extension/src/panel/index.tsx`
- Test: manual preview check against sample extraction

- [ ] **Step 1: Write the failing expectation**

The panel should render both an inspection summary and a preview based only on normalized data.

- [ ] **Step 2: Verify it is missing**

Run: load panel UI in dev mode
Expected: no inspection or preview flow exists

- [ ] **Step 3: Implement preview**

Add:

- normalized summary view
- preview renderer
- unsupported-case warnings
- lightweight review markers for uncertain elements

- [ ] **Step 4: Verify preview**

Run: compare panel preview against the selected page block
Expected: structure and major visuals are recognizable before rewrite

- [ ] **Step 5: Commit**

```bash
git add extension/src/core/preview extension/src/panel
git commit -m "feat: add normalized block preview"
```

## Chunk 4: Rewrite and Export

### Task 7: Build rewrite request assembly

**Files:**
- Create: `extension/src/core/rewrite/buildRewriteRequest.ts`
- Create: `extension/src/core/rewrite/buildPrompt.ts`
- Modify: `extension/src/shared/schema.ts`
- Test: one generated prompt snapshot per sample block

- [ ] **Step 1: Write the failing expectation**

The system should convert normalized block data and user constraints into a bounded rewrite request for the LLM.

- [ ] **Step 2: Verify it is missing**

Run: `rg -n "buildRewriteRequest|buildPrompt" extension/src`
Expected: no rewrite assembly exists

- [ ] **Step 3: Implement request assembly**

Build:

- target stack options
- non-copying constraints
- normalized block summary
- screenshot references
- uncertainty notes
- expected output sections

- [ ] **Step 4: Verify request quality**

Run: inspect one generated prompt payload
Expected: prompt is compact, explicit, and schema-driven

- [ ] **Step 5: Commit**

```bash
git add extension/src/core/rewrite extension/src/shared/schema.ts
git commit -m "feat: add rewrite request assembly"
```

### Task 8: Add model call orchestration and export UI

**Files:**
- Create: `extension/src/background/rewriteJob.ts`
- Create: `extension/src/panel/components/RewriteOutput.tsx`
- Create: `extension/src/panel/components/ExportActions.tsx`
- Modify: `extension/src/background/index.ts`
- Modify: `extension/src/panel/index.tsx`
- Test: end-to-end manual flow with mocked model response first, live model second

- [ ] **Step 1: Write the failing expectation**

Users should be able to trigger rewrite, review generated code, and export results from the panel.

- [ ] **Step 2: Verify it is missing**

Run: manual panel flow
Expected: there is no rewrite execution or export path

- [ ] **Step 3: Implement orchestration**

Add:

- background rewrite job handling
- loading/error states
- mocked response path for local development
- code result rendering
- export actions

- [ ] **Step 4: Verify the flow**

Run: manual end-to-end flow
Expected: user can select, inspect, preview, rewrite, and export within one session

- [ ] **Step 5: Commit**

```bash
git add extension/src/background extension/src/panel
git commit -m "feat: add rewrite and export flow"
```

## Chunk 5: Hardening and Scope Guards

### Task 9: Add unsupported-case detection

**Files:**
- Create: `extension/src/core/extractor/detectUnsupportedFeatures.ts`
- Modify: `extension/src/core/extractor/captureSelection.ts`
- Modify: `extension/src/panel/components/InspectionSummary.tsx`
- Test: manual checks on canvas/iframe-heavy targets

- [ ] **Step 1: Write the failing expectation**

The system should clearly flag unsupported or risky targets before rewrite.

- [ ] **Step 2: Verify it is missing**

Run: test against a canvas-heavy or iframe-based page
Expected: current flow would attempt extraction without warning

- [ ] **Step 3: Implement detection**

Flag:

- canvas-heavy blocks
- iframe-contained blocks
- unusually deep trees
- likely pseudo-element-heavy decorations
- likely motion-heavy modules

- [ ] **Step 4: Verify behavior**

Run: manual unsupported-case checks
Expected: warnings are visible before rewrite

- [ ] **Step 5: Commit**

```bash
git add extension/src/core/extractor extension/src/panel/components/InspectionSummary.tsx
git commit -m "feat: warn on unsupported extraction targets"
```

### Task 10: Final verification and documentation

**Files:**
- Create: `extension/README.md`
- Modify: relevant `extension/src/**` files as needed
- Test: manual MVP smoke test and build verification

- [ ] **Step 1: Write the failing expectation**

The MVP should be understandable to a new engineer and runnable with a documented local workflow.

- [ ] **Step 2: Verify the gap**

Run: `test -f extension/README.md; echo $?`
Expected: no extension README exists yet

- [ ] **Step 3: Add final docs and polish**

Document:

- how to build/load the extension
- supported scenarios
- unsupported scenarios
- MVP architecture summary
- known fidelity limitations

Fix any naming or protocol drift discovered during the smoke test.

- [ ] **Step 4: Verify completion**

Run: extension build/manual smoke test
Expected: the documented workflow matches actual behavior

- [ ] **Step 5: Commit**

```bash
git add extension
git commit -m "docs: finalize UI replication extension MVP"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-11-ui-replication-plugin-implementation-plan.md`. Ready to execute?
