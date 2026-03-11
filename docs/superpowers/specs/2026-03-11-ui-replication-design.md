# UI Replication Design

**Date:** 2026-03-11

**Goal:** Build a repeatable workflow for pixel-accurate recreation of a visually polished frontend UI block when source code is unavailable, using browser/plugin-assisted evidence collection and LLM-driven maintainable reimplementation.

## Context

The target scenario is:

- The original UI exists on an internal company webpage.
- Source code is unavailable.
- Browser DevTools access is available.
- The desired output is a pixel-accurate recreation.
- The implementation must remain maintainable.
- The solution must not directly copy the original DOM structure or CSS implementation.
- The preferred workflow uses plugins/tools for extraction and an LLM to rewrite the implementation.

## Non-Goals

- One-click webpage-to-production conversion.
- Exact recovery of the original source structure or naming.
- A workflow that depends on access to design source files.
- A screenshot-only fake implementation intended for demos.

## Recommended Approach

Use a three-stage workflow:

1. Evidence collection through browser tools and plugins.
2. Structured prompt construction from that evidence.
3. LLM-driven semantic reimplementation followed by manual visual calibration.

This is intentionally not a direct code-generation pipeline. Tools accelerate observation; the final implementation is a new codebase artifact with clean boundaries.

## Workflow

### 1. Environment Lock

Before collecting any evidence, fix the observation environment:

- Browser and version
- Viewport dimensions
- Zoom level
- Device pixel ratio assumptions
- System font environment if relevant

This prevents measurement drift across screenshots and DevTools readings.

### 2. Evidence Collection

Collect evidence in five categories.

#### A. Visual snapshots

- Default-state screenshot
- Hover-state screenshot
- Active/open/selected-state screenshot
- Responsive variants if applicable
- Cropped zoomed-in screenshots for critical details

#### B. Structural summary

Capture the semantic layering of the block rather than raw DOM dumps. For each major region, identify:

- Container
- Background layer
- Content layer
- Decoration layer
- Interaction/state layer
- Animation-driving elements

#### C. Computed style facts

For each critical node, record:

- Size and spacing
- Layout mode
- Positioning
- Typography
- Color/background/gradient
- Border/radius/shadow
- Filters and backdrop filters
- Transform and transform-origin
- Transition/animation configuration

#### D. Interaction behavior

Record state transitions such as:

- Hover elevation
- Focus outline changes
- Selected tab background and text changes
- Expand/collapse behavior
- Button press states

#### E. Motion behavior

Capture:

- Trigger condition
- Moving element
- Duration
- Delay
- Easing
- Looping or one-shot behavior

Recording may come from DevTools plus manual observation of screen recordings.

### 3. Structured Input for LLM Rewrite

The LLM should receive a compact, evidence-based brief instead of raw browser dumps.

Required prompt sections:

- Target stack
- UI purpose
- Layered structure summary
- Per-element style facts
- State/interaction transitions
- Motion timeline notes
- Constraints

Required constraints:

- Do not copy original DOM structure.
- Do not copy original class names.
- Rebuild using semantic components.
- Prioritize maintainability.
- Match static appearance first, then interactions, then motion.

### 4. Reimplementation Strategy

The generated implementation should be organized into:

- A semantic section/container component
- Small subcomponents for repeated or distinct visual units
- Shared styling tokens for spacing, color, radius, shadow, and typography
- Explicit state handling for UI modes
- Isolated motion logic for transitions/animations

Avoid treating the generated output as final if it relies on:

- Excessive absolute positioning
- Unclear wrapper nesting
- Repeated literal values everywhere
- Coupled visual and behavioral logic

### 5. Calibration Loop

Refinement should happen in three passes:

1. Static visual pass
2. Interaction state pass
3. Motion/timing pass

Do not optimize the motion layer until the static layer is visually close.

## Tool Strategy

Use tools by responsibility, not by convenience:

- Structure inspection tools: understand hierarchy and state changes
- Style inspection tools: extract computed visual facts
- Motion inspection tools: reverse engineer timing and triggers
- LLM tooling: rewrite into maintainable code

Do not rely on webpage-to-code plugins as the final source of truth. They may be used as references, but not as production-ready output.

## Risks

### Typography mismatch

Minor font rendering differences can block pixel-accurate reproduction even when layout is correct.

### Missing pseudo-elements and overlays

Highly polished UI often depends on `::before`, `::after`, masks, overlays, and blend layers that are easy to overlook.

### Filter/transparency mismatch

Blur, translucency, layered shadows, and gradients often produce the last visible 10 percent of fidelity problems.

### Timing mismatch

Animations can feel wrong even when they are functionally present.

### Maintainability regression

Without explicit constraints, generated code may reproduce appearance but remain brittle and hard to evolve.

## Acceptance Criteria

The recreation is acceptable when:

- Static comparison at the target viewport is visually indistinguishable or extremely close.
- Key spacing, sizing, border radius, shadow, and typography values align with the observed reference.
- Hover, selected, open, and focus states match the reference behavior.
- Animation trigger, duration, delay, and easing are close enough to preserve the same perceived motion.
- The final code structure is semantic and understandable without reading the original page's implementation.

## Operating Principle

The core principle is:

> Tools help observe. The LLM helps restructure. Humans validate fidelity.

This preserves speed without sacrificing maintainability or crossing into direct source copying.
