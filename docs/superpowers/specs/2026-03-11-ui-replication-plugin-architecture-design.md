# UI Replication Plugin Architecture Design

**Date:** 2026-03-11

**Goal:** Define the architecture of a Chrome extension that lets a user select a webpage module, inspect the extracted structure, preview the interpreted result, and ask an LLM to rewrite it into maintainable frontend code.

## Product Scenario

The target user flow is:

1. The user clicks a browser extension action.
2. The page enters selection mode.
3. The user moves the mouse over the page and sees candidate modules highlighted.
4. The user clicks to choose a module.
5. The extension extracts structural and visual facts from that module.
6. The extension shows a preview of the interpreted result.
7. The user triggers an LLM rewrite to produce maintainable code.
8. The user reviews and exports the generated result.

The product is not a generic webpage copier. It is a guided extraction and rewrite system.

## Design Principles

- Prefer explainable extraction over opaque magic.
- Use DOM and computed styles as the primary evidence source.
- Use screenshots and visual analysis only to fill fidelity gaps.
- Never treat raw copied DOM/CSS as the final output.
- Keep preview and rewrite powered by the same normalized schema.
- Make uncertainty visible instead of pretending extraction is perfect.

## Architecture Summary

The system uses a mixed extraction strategy:

1. DOM-first extraction for structure and styles.
2. Visual fallback for gaps in appearance or layering.
3. Schema normalization as the system boundary.
4. Preview rendering before rewrite.
5. LLM rewrite after user confirmation.

The core architecture is:

- `Selector`
- `Extractor`
- `Normalizer`
- `Preview Renderer`
- `Rewrite Engine`
- `Plugin Workbench`

## System Modules

### 1. Selector

Runs in the webpage context and manages selection mode.

Responsibilities:

- Track mouse movement over candidate DOM regions
- Compute reasonable module boundaries
- Ignore tiny or noisy nodes
- Allow parent/child candidate escalation
- Draw highlight overlays
- Freeze the selected block on click

The selector should optimize for stable candidate choice, not literal hovered element identity.

### 2. Extractor

Collects raw facts from the selected block.

Responsibilities:

- Build a simplified DOM tree
- Read computed styles for critical nodes
- Capture bounding boxes
- Detect resource references
- Detect potential pseudo-element or decoration hints
- Capture screenshots of the selected block
- Record state or interaction hints where observable

Extractor output is allowed to be noisy because it reflects the messy reality of live webpages.

### 3. Normalizer

Transforms raw extraction output into a stable schema for all downstream consumers.

Responsibilities:

- Collapse noisy DOM details into semantic block structure
- Separate content from decoration
- Group layout containers and repeated items
- Extract design tokens
- Attach confidence and review markers
- Produce a single canonical `NormalizedBlock`

This is the most important system boundary. Preview and rewrite must depend on this layer instead of raw extraction output.

### 4. Preview Renderer

Renders the normalized block into a reviewable preview inside the extension workbench.

Responsibilities:

- Show what the system believes the block is
- Reveal missing or uncertain elements
- Support light user correction before rewrite
- Reuse normalized data instead of re-extracting

The preview is a validation surface, not just a nice-to-have screen.

### 5. Rewrite Engine

Turns normalized block data into LLM-ready rewrite requests and interprets the results.

Responsibilities:

- Compose the model prompt from schema, screenshots, and user constraints
- Enforce non-copying rules
- Target a chosen output stack
- Parse response sections into code artifacts
- Surface uncertainty and follow-up notes

The rewrite engine should only consume normalized schema plus explicitly attached evidence.

### 6. Plugin Workbench

Owns the end-user workflow and orchestration.

Responsibilities:

- Manage phase transitions
- Display extracted summaries
- Show preview and generated code
- Allow re-run with adjusted constraints
- Export outputs
- Surface errors and unsupported cases

## Runtime Partitioning

The extension should be organized by execution environment.

### `content`

Runs inside the active webpage.

Owns:

- Selection overlays
- Candidate scoring hooks
- DOM/style extraction
- Screenshot triggers and page-local data collection

### `background`

Runs as the extension coordinator.

Owns:

- Session orchestration
- Cross-context messaging
- Model request execution
- Caching of extraction and rewrite jobs
- Tab and panel state

### `panel`

Runs the extension UI.

Owns:

- Selection controls
- Extraction summary view
- Preview UI
- Rewrite controls
- Code display and export

### `core`

Holds shared product logic independent from runtime shell.

Owns:

- Candidate scoring rules
- Extraction transforms
- Schema normalization
- Preview mapping
- Prompt assembly

### `shared`

Holds common types and protocols.

Owns:

- Message contracts
- Schema definitions
- Status enums
- Utility helpers

## Data Flow

The canonical flow is:

1. User starts selection mode from the plugin.
2. Content script activates selector overlays.
3. Selector scores hovered candidates and highlights the current best block.
4. User confirms the target block.
5. Extractor captures raw DOM, styles, bounds, resources, and screenshot evidence.
6. Background receives raw extraction output.
7. Normalizer produces a `NormalizedBlock`.
8. Panel renders inspection and preview views from the normalized data.
9. User chooses rewrite settings and confirms rewrite.
10. Background builds a `RewriteRequest` and sends it to the LLM service.
11. Panel receives parsed rewrite results and presents them for export.

## Core Data Model

The system should not rely on a single overloaded object. Use four layers.

### `SelectionSnapshot`

Captures what was selected and under what conditions.

Fields should include:

- source URL
- page title
- viewport metadata
- root selector hints
- root bounds
- screenshot references
- capture timestamp

### `ExtractedTree`

Captures raw page facts from the selected block.

Fields should include:

- simplified nodes
- text content
- bounds
- critical computed styles
- resource references
- pseudo-element hints
- interaction hints

### `NormalizedBlock`

Acts as the system contract for preview and rewrite.

Fields should include:

- `meta`
- `layout`
- `content`
- `decorations`
- `assets`
- `states`
- `motion`
- `tokens`
- `confidence`
- `needsReview`

### `RewriteRequest`

Captures everything needed for maintainable code generation.

Fields should include:

- target tech stack
- output format
- normalized block
- screenshot references
- user constraints
- uncertainty notes

## Interaction Flow

The workbench should use a phased experience:

1. `idle`
2. `selecting`
3. `capturing`
4. `inspecting`
5. `previewing`
6. `rewriting`
7. `export-ready`
8. `error`

Each phase should have a single primary action and explicit status messaging.

## MVP Scope

The first version should support:

- standard DOM-based marketing or dashboard modules
- text, image, icon, button, and card-heavy blocks
- basic hover or selected states
- standard CSS-driven visual presentation

The first version should not support:

- canvas-heavy blocks
- iframe-contained targets
- complex scroll-driven animation systems
- WebGL or 3D scenes
- heavily data-coupled runtime widgets
- video-first modules

## Key Risks

### Candidate instability

If selection jumps unpredictably, the product will feel broken before extraction even starts.

### Schema drift

If preview and rewrite depend on different representations, the user will lose trust quickly.

### Oversized model inputs

Raw DOM and style evidence can grow too large. Normalization and summarization are mandatory.

### Fidelity gaps in decoration and motion

Pseudo-elements, masks, filters, and timing are common failure points that need explicit handling.

### Overpromising support

If unsupported blocks are not clearly flagged, users will assume the tool is unreliable instead of bounded.

## Acceptance Criteria

The architecture is successful when:

- a user can reliably select a meaningful module instead of a noisy leaf node
- extracted data can be normalized into a stable schema
- preview and rewrite both consume the same normalized representation
- generated code is semantically structured and maintainable
- unsupported scenarios fail clearly rather than silently degrading

## Recommended Next Step

Implement the product in MVP order:

1. selector stability
2. raw extraction
3. normalization schema
4. preview from normalized block
5. rewrite request assembly
6. export workflow

This sequence keeps the project grounded in system correctness rather than demo-only output.
