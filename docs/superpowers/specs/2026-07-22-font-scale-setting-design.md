# Font Scale Setting Design

## Goal

Allow every user role to choose a readable application-wide font size without
reloading the page. The setting must be usable by older users and remain
available on authentication pages as well as authenticated pages.

## User experience

The application exposes one global “Font size” control from the root shell.
Selecting a preset applies it immediately and closes the control:

- Normal: 100%
- Large: 112.5%
- Extra large: 125%

The selected preset is visually marked, announced to assistive technology, and
persisted across refreshes. The control uses text labels and accessible names,
not emoji or unlabeled icons.

## Architecture

`FontScaleService` owns the `normal | large | xlarge` state, reads and writes
`localStorage`, and applies the corresponding root `font-size` to the document.
The root scale is based on `rem`, so existing typography tokens and utility
classes respond consistently.

`FontScaleControlComponent` renders the accessible control and consumes the
service. It is mounted by `AppComponent`, making it available on every route.
Translations for labels, presets, and confirmation feedback live in
`I18nService`.

## Layout safeguards

The implementation must be checked at 375px, 640px, 768px, and 1440px widths.
The extra-large preset must not introduce horizontal scrolling or hide primary
content. Game-specific number and countdown typography may use bounded
overrides so those values remain inside the viewport.

## Accessibility

- Presets are keyboard reachable and expose selected state with
  `aria-pressed`.
- The control has a visible focus ring and touch targets of at least 44px.
- Applying a preset announces the new size through an accessible status.
- Text remains at least 16px for important body copy, labels, actions, and
  errors.
- The setting continues to work after switching Thai/English.
- The document language remains synchronized with the selected application
  language.

## Acceptance criteria

1. Changing the preset updates all routes immediately without a reload.
2. Refreshing the browser restores the selected preset.
3. The default state is Normal when no preference exists.
4. All presets work in Thai and English.
5. The Extra large preset does not cause horizontal scrolling at the required
   breakpoints.
6. Keyboard and screen-reader users can select and identify the active preset.

## Testing

Add unit tests for default selection, persistence, root-style application, and
each preset. Add component tests for rendering, selected state, keyboard
selection, and accessible status feedback. Verify the required responsive
breakpoints with the running application.
