# Font Scale Setting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible, persistent three-level font-size setting available on every route and for every user role.

**Architecture:** A root-provided `FontScaleService` owns the selected preset and applies a rem-based root scale to `document.documentElement`. A standalone `FontScaleControlComponent` is mounted by `AppComponent`, so the control is available on auth and authenticated routes without duplicating it in page components.

**Tech Stack:** Angular 17 standalone components, TypeScript signals, Tailwind CSS, Jasmine/Karma, browser `localStorage`.

## Global Constraints

- Presets are exactly `normal` (100%), `large` (112.5%), and `xlarge` (125%).
- The setting applies immediately without a reload and persists across refreshes.
- Important body copy, labels, actions, and errors remain at least 16px.
- No emoji or unlabeled icon is used for the setting UI.
- Touch targets are at least 44px and keyboard focus is visible.
- Verify responsive behavior at 375px, 640px, 768px, and 1440px.
- The xlarge preset must not introduce horizontal scrolling or hide primary content.

---

### Task 1: Build and test the font-scale service

**Files:**
- Create: `src/app/services/font-scale.service.ts`
- Test: `src/app/services/font-scale.service.spec.ts`

**Interfaces:**
- Produces `FontScale = 'normal' | 'large' | 'xlarge'`.
- Produces `fontScale: Signal<FontScale>`.
- Produces `setFontScale(scale: FontScale): void`.
- Produces `scalePercent(scale: FontScale): number`.

- [ ] **Step 1: Write failing tests**

Test the service contract:

```typescript
it('starts at normal when there is no saved preference', () => {
  localStorage.removeItem('ctar_font_scale');
  const service = TestBed.inject(FontScaleService);
  expect(service.fontScale()).toBe('normal');
  expect(document.documentElement.style.fontSize).toBe('100%');
});

it('restores and applies a saved preset', () => {
  localStorage.setItem('ctar_font_scale', 'xlarge');
  const service = TestBed.inject(FontScaleService);
  expect(service.fontScale()).toBe('xlarge');
  expect(document.documentElement.style.fontSize).toBe('125%');
});

it('persists and applies a newly selected preset', () => {
  const service = TestBed.inject(FontScaleService);
  service.setFontScale('large');
  expect(service.fontScale()).toBe('large');
  expect(localStorage.getItem('ctar_font_scale')).toBe('large');
  expect(document.documentElement.style.fontSize).toBe('112.5%');
});
```

- [ ] **Step 2: Run the service spec and verify it fails**

Run:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

Expected: the new spec fails because `FontScaleService` does not exist.

- [ ] **Step 3: Implement the minimal service**

Use a root service with a typed preset map:

```typescript
export type FontScale = 'normal' | 'large' | 'xlarge';

const FONT_SCALE_PERCENT: Record<FontScale, number> = {
  normal: 100,
  large: 112.5,
  xlarge: 125,
};
```

Read only valid stored values, initialize the signal, and apply the selected
percentage through `document.documentElement.style.fontSize`. Persist each
selection under `ctar_font_scale`.

- [ ] **Step 4: Run the service spec and verify it passes**

Run the same command. Expected: all service assertions pass; if ChromeHeadless
cannot launch in the local environment, verify compilation with `npm run build`
and record the browser-launch limitation.

### Task 2: Add the global accessible control

**Files:**
- Create: `src/app/components/font-scale-control/font-scale-control.component.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/app/services/i18n.service.ts`
- Test: `src/app/components/font-scale-control/font-scale-control.component.spec.ts`

**Interfaces:**
- Consumes `FontScaleService.fontScale()` and `setFontScale()`.
- Uses translations `accessibility.fontSize`, `accessibility.fontSizeNormal`,
  `accessibility.fontSizeLarge`, `accessibility.fontSizeXLarge`, and
  `accessibility.fontSizeApplied`.

- [ ] **Step 1: Write failing component tests**

Test that the control renders three options, marks the active option with
`aria-pressed="true"`, calls the service when a preset is selected, and exposes
an `aria-live="polite"` status after selection.

- [ ] **Step 2: Run the component spec and verify it fails**

Run:

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

Expected: the spec fails because the component and translations do not exist.

- [ ] **Step 3: Implement the control**

Create a standalone component with:

- A fixed or compact control that does not cover primary game content.
- A 44px minimum trigger button with visible text or an accessible label.
- Three text-labeled preset buttons.
- `aria-pressed` on each preset.
- A polite live region confirming the selected level.
- Existing global focus-ring styling and `cursor-pointer`.

Mount `<app-font-scale-control></app-font-scale-control>` in the root template
of `AppComponent`, outside `router-outlet`, so it appears on Login, Register,
Portal, Clinic, Calibrate, Game, and Summary.

Add Thai and English translations in `I18nService`, and keep the existing
document language synchronization behavior intact.

- [ ] **Step 4: Run component and service tests**

Run the test command again. Expected: service and component assertions pass.

### Task 3: Protect responsive layouts at all font levels

**Files:**
- Modify: `src/styles.css`
- Modify: `src/app/components/zen-balloon/zen-balloon.component.ts`
- Modify: components only where the xlarge preset reveals a real overflow
- Test: `src/app/components/font-scale-control/font-scale-control.component.spec.ts`

- [ ] **Step 1: Add layout-focused failing assertions**

Assert that the control remains keyboard reachable, has a minimum 44px target,
and that the game title, countdown, primary action, and feedback remain present
when the xlarge preset is active.

- [ ] **Step 2: Run the assertions and verify the expected failure**

Run the focused test command and confirm the assertions identify any missing
responsive behavior rather than a test setup error.

- [ ] **Step 3: Implement only required safeguards**

Keep normal document flow and prevent horizontal overflow. Use bounded game
overrides only for the large countdown and force number; do not hide the game
title or primary actions. Keep all important copy at 16px or larger.

- [ ] **Step 4: Verify responsive breakpoints manually**

Run the application and inspect each route at 375px, 640px, 768px, and 1440px
with all three presets. Confirm no horizontal scroll, clipped action, or
unreadable status.

### Task 4: Final verification

**Files:**
- Verify all files from Tasks 1–3.

- [ ] **Step 1: Run lint diagnostics**

Use the IDE linter on the new service, control, root component, translations,
styles, and any modified game components. Expected: no new diagnostics.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: exit code 0. Existing bundle-size warnings may remain, but no
TypeScript or template compilation errors are acceptable.

- [ ] **Step 3: Run whitespace and repository checks**

Run:

```bash
git diff --check
```

Expected: no whitespace errors. Confirm the plan and spec files are unchanged
after implementation unless the user explicitly requests documentation edits.
