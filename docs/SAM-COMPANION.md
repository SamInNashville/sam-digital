# Sam companion — acceptance criteria

This refinement supersedes the first Dot roaming pass. Sam is explicitly the browser AI, not a person. Appearance and the surrounding conversation experience remain established.

## Behavior contract

- Sam remains present as the visitor scrolls. A cramped viewport is not a reason to disappear.
- Behavior has readable purpose: accompany the visitor, attend to the focused or explored activity, watch a game/design interaction, listen during typing, and invite conversation during an appropriate quiet moment.
- Priority and dwell time matter more than travel distance. No arbitrary patrol is a substitute for attention.
- Do not seize keyboard focus, scroll the document, intercept controls, or collect field values.
- User hide, global pause, reduced motion, hidden tabs and dialogs remain respected.

## Bubble thrust

Thrust must read as bubbles, not tiny sparks or a flame. They should visibly inherit motion, eject from jetpack pods, decelerate through drag, turn upward under buoyancy, interact softly and fade/pop with bounded lifetimes. Population, timestep and rendering must be bounded. No new external service or dependency.

## Evidence

- `tests/sam-companion.mjs`: real browser recording; continuous scroll sampling desktop/mobile; visible identity and bubble layer; focus, hide, pause/resume, dialog and reduced-motion behavior.
- `tests/pet-physics.mjs`: deterministic physics checks, independent of browser rendering.
- Existing experience, gallery and story UI tests protect the surrounding site.
- Visual review of `proof/sam/` is required: numerical checks alone did not make the first pass convincing.

The controller is authored UI choreography, not an autonomous model or access to private visitor thoughts. Model instructions and inference are outside this change.

Verified locally: actual rendered bubble pixels change over time; continuous scroll visibility on desktop and phone; keyboard focus remains with the visitor; deterministic force/collision tests and experience/gallery/story regressions pass. Bubble renderer supports up to 48 particles with bounded per-step integration. Legacy `tests/pet-roam.mjs` forwards to the new browser contract.
