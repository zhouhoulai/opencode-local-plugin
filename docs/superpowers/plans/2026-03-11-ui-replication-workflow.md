# UI Replication Workflow Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable workflow, templates, and guidance for plugin-assisted UI evidence capture and LLM-based maintainable recreation of source-unavailable frontend blocks.

**Architecture:** The work is documentation-first. Create a reusable evidence-capture template, a prompt template for LLM rewrite, and a verification checklist that turns ad hoc recreation work into a repeatable process. Keep artifacts under `docs/superpowers/` so future UI replication tasks can reuse them without touching product code.

**Tech Stack:** Markdown documentation, existing Next.js repository conventions, browser DevTools, external plugins/tools chosen during execution

---

## Chunk 1: Documentation Scaffold

### Task 1: Add reusable workflow overview

**Files:**
- Create: `docs/superpowers/guides/ui-replication-workflow.md`
- Modify: `README.md`
- Test: manual review of links and document readability

- [ ] **Step 1: Write the failing expectation**

Document the desired navigation and outcomes:

- `README.md` should point readers to the new workflow guide.
- The new guide should explain the end-to-end process at a high level.

- [ ] **Step 2: Verify the expectation is currently unmet**

Run: `rg -n "ui-replication-workflow|UI replication" README.md docs`
Expected: no matching reusable workflow guide or README link

- [ ] **Step 3: Add the workflow overview**

Create `docs/superpowers/guides/ui-replication-workflow.md` with sections for:

- When to use this workflow
- Inputs required
- Evidence collection flow
- LLM rewrite flow
- Calibration flow
- Common failure modes

Update `README.md` with one short pointer to the guide.

- [ ] **Step 4: Review the result**

Run: `sed -n '1,220p' docs/superpowers/guides/ui-replication-workflow.md`
Expected: the workflow reads as a standalone guide for a new engineer

- [ ] **Step 5: Commit**

```bash
git add README.md docs/superpowers/guides/ui-replication-workflow.md
git commit -m "docs: add UI replication workflow guide"
```

### Task 2: Add evidence-capture template

**Files:**
- Create: `docs/superpowers/templates/ui-evidence-capture-template.md`
- Test: manual review using a sample UI block

- [ ] **Step 1: Define the failing expectation**

The repo should contain a reusable template that tells an engineer exactly what evidence to capture from a target UI block.

- [ ] **Step 2: Verify it does not exist**

Run: `rg -n "evidence capture|computed style|hover-state screenshot" docs`
Expected: no reusable UI evidence template exists

- [ ] **Step 3: Create the template**

Create `docs/superpowers/templates/ui-evidence-capture-template.md` with fill-in sections for:

- Metadata and viewport lock
- Screenshot matrix
- Layered structure summary
- Per-element computed style table
- Interaction states
- Motion observations
- Asset inventory
- Open questions and uncertainty markers

- [ ] **Step 4: Review the template**

Run: `sed -n '1,260p' docs/superpowers/templates/ui-evidence-capture-template.md`
Expected: a user can fill it without needing additional instructions

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/templates/ui-evidence-capture-template.md
git commit -m "docs: add UI evidence capture template"
```

## Chunk 2: Prompting and Verification Assets

### Task 3: Add LLM rewrite prompt template

**Files:**
- Create: `docs/superpowers/templates/ui-llm-rewrite-prompt.md`
- Test: manual prompt dry run against one sample target

- [ ] **Step 1: Define the failing expectation**

The repo should contain a prompt template that converts captured UI evidence into maintainable implementation instructions for an LLM.

- [ ] **Step 2: Verify it does not exist**

Run: `rg -n "Do not copy original DOM|Match static appearance first" docs`
Expected: no reusable prompt template exists

- [ ] **Step 3: Create the prompt template**

Create `docs/superpowers/templates/ui-llm-rewrite-prompt.md` with sections for:

- Target stack and coding constraints
- UI purpose
- Layer breakdown
- Style facts
- State transitions
- Motion timeline
- Explicit non-copying rules
- Expected output format

- [ ] **Step 4: Review the prompt**

Run: `sed -n '1,260p' docs/superpowers/templates/ui-llm-rewrite-prompt.md`
Expected: the prompt is specific enough that a model would not rely on guessing

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/templates/ui-llm-rewrite-prompt.md
git commit -m "docs: add UI LLM rewrite prompt template"
```

### Task 4: Add fidelity verification checklist

**Files:**
- Create: `docs/superpowers/checklists/ui-fidelity-checklist.md`
- Test: manual checklist walk-through on a recreated block

- [ ] **Step 1: Define the failing expectation**

The repo should contain a standard checklist for validating static, interaction, and motion fidelity after implementation.

- [ ] **Step 2: Verify it does not exist**

Run: `rg -n "motion pass|static visual pass|hover, selected, open" docs`
Expected: no dedicated fidelity checklist exists

- [ ] **Step 3: Create the checklist**

Create `docs/superpowers/checklists/ui-fidelity-checklist.md` covering:

- Environment parity
- Static visual parity
- State parity
- Motion parity
- Accessibility/basic interaction sanity
- Maintainability review

- [ ] **Step 4: Review the checklist**

Run: `sed -n '1,260p' docs/superpowers/checklists/ui-fidelity-checklist.md`
Expected: the checklist is actionable and not vague

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/checklists/ui-fidelity-checklist.md
git commit -m "docs: add UI fidelity verification checklist"
```

## Chunk 3: Example and Handoff

### Task 5: Add one worked example

**Files:**
- Create: `docs/superpowers/examples/ui-replication-example.md`
- Test: manual read-through for completeness

- [ ] **Step 1: Define the failing expectation**

The repo should include one worked example showing how a single UI block moves from evidence capture to rewrite instructions.

- [ ] **Step 2: Verify it does not exist**

Run: `rg -n "worked example|replication example" docs/superpowers`
Expected: no example exists

- [ ] **Step 3: Create the example**

Create `docs/superpowers/examples/ui-replication-example.md` with:

- A fictional or sanitized UI block description
- Filled evidence summary
- LLM prompt excerpt
- Expected component decomposition
- Final verification notes

- [ ] **Step 4: Review the example**

Run: `sed -n '1,260p' docs/superpowers/examples/ui-replication-example.md`
Expected: a new engineer could imitate the workflow from the example

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/examples/ui-replication-example.md
git commit -m "docs: add UI replication worked example"
```

### Task 6: Final consistency pass

**Files:**
- Modify: `docs/superpowers/guides/ui-replication-workflow.md`
- Modify: `docs/superpowers/templates/ui-evidence-capture-template.md`
- Modify: `docs/superpowers/templates/ui-llm-rewrite-prompt.md`
- Modify: `docs/superpowers/checklists/ui-fidelity-checklist.md`
- Modify: `docs/superpowers/examples/ui-replication-example.md`
- Test: repository-wide grep and manual doc review

- [ ] **Step 1: Define the failing expectation**

All workflow docs should use consistent terminology for layers, states, motion, and non-copying constraints.

- [ ] **Step 2: Review for drift**

Run: `rg -n "layer|state|motion|Do not copy|maintainability" docs/superpowers`
Expected: terminology gaps or inconsistencies may appear before cleanup

- [ ] **Step 3: Normalize wording**

Update the documents so they all consistently describe:

- evidence collection
- LLM rewrite constraints
- three-pass calibration
- acceptance criteria

- [ ] **Step 4: Verify coherence**

Run: `git diff -- docs/superpowers`
Expected: terminology is aligned and the docs read as one system

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers
git commit -m "docs: finalize UI replication workflow assets"
```

Plan complete and saved to `docs/superpowers/plans/2026-03-11-ui-replication-workflow.md`. Ready to execute?
