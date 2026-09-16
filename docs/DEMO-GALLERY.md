# On-demand demo gallery

The gallery is a set of four static, authored SVG swatches. None of the demo modules is downloaded or mounted before its swatch is clicked. They are explicitly experiments, not client projects.

- Arcade: neon Breakout, delta-time collision logic, reinforced bricks, real score/lives, difficulty, keyboard/touch control, bursts/trail, pause/reset. Best score is local to that modal instance, not persisted.
- Design: palette/type/layout controls, live ink/surface contrast calculation, responsive editorial preview, honest selection microinteraction. Phone controls collapse so the actual preview is visible first.
- Particles: bounded projected 3D point-cloud forms, orbit/pull/repel, density and energy controls, pause/reset. Canvas2D projects real point positions; this is not claimed to be a GPU renderer. Reduced-motion opens on a static form with explicit Play.
- Pathfinder: actual A* and Dijkstra on a four-neighbor grid, editable walls and endpoints, keyboard cursor/tool application, animated exploration and route, measured counts, explicit no-route status. Editing invalidates stale results. Reduced-motion shows completed search without exploration animation.

`src/showcase.js` owns native modal semantics, Escape/close, focus restoration, overflow restoration and lazy-import generation guards. Each `src/demos/*.js` exports `mount(host) -> cleanup`. Closing destroys the instance and cancels its animation/listeners; reopening starts fresh. Modal loading must not change enquiry state or generate transcript entries. The existing pet already docks for open dialogs.

## Verification

- `node tests/showcase.mjs`: all four desktop demos, exact hero, no demo chunks before click, per-demo chunk loading, real scoring/pixels/controls, route comparison, accessibility, cleanup and focus restoration.
- `MOBILE=1 node tests/showcase.mjs`: same behavior at phone width; screenshots and JSON per demo.
- `node tests/demo-lifecycle.mjs`: close before lazy import resolves, reopen, reduced-motion behavior, edited-result invalidation and nine palette/layout contrast variants.
- `node tests/pathfinder.mjs`: both searches compared with independent BFS on 60 seeded obstacle fields; unreachable and singleton cases.
- `node tests/breakout-physics.mjs`: actual mount/input/physics code under a deterministic frame clock; full clear and missed-paddle loss. Drawing is stubbed for this algorithm test, not claimed as pixel proof. Separate gallery tests capture real rendered output.
- `node tests/experience.mjs`, `node tests/pet-dialogue.mjs`, `node tests/pet-speech.mjs`: preserved surrounding UI, authored dialogue and reading protections.

Browser AI worker fixtures isolate UI tests; they are not claims of real model inference. Pet tests targeting the former inline game/design controls now focus the corresponding swatches, without opening a modal. Speech replacement allows the already-approved three-second spontaneous fly-by to finish before checking the next visible line.

Hero text is Patrick's exact requested wording. Both pet references to project/answer 'shape' are rewritten around 'details'. No model instructions, transcript/email logic, or pet motion implementation changed.
