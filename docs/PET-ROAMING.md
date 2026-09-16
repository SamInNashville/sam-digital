# Dot: roaming jetpack companion

Pet-only refinement. Conversation instructions, worker behavior, story policy, neural overlay, cloud and gallery are unchanged.

- Adds jetpack pods, blue exhaust during flight, leaning movement and pointer-aware eyes.
- Roams on bounded timers; pointer curiosity is throttled. Focus attracts a nearby visit and directs its gaze without programmatic focus or scrolling.
- Flight routes use a visibility graph around padded text and interactive-element bounds. If no safe path exists, Dot stays put. On cramped mobile layouts this deliberately means less roaming.
- Once per page visit, after 18 seconds without visitor activity, Dot can point toward the visible chat input and offer an invitation. Never while that input is focused. A subtle input marker disappears with the bubble or the next interaction.
- Brief authored bubbles describe UI context, not inferred visitor thoughts or generated conversation. Bubble frequency is capped, placement avoids protected content, and they are decorative/non-live to assistive technology.
- No field values are read by the roaming controller. No network, analytics, persistence, model calls, transcript changes, or new dependency.
- Pause/reduced-motion docks Dot; hiding hides all pet layers. Open dialogs suppress flight. Scroll/resize recalculates safe perches. Page visibility and BFCache are handled.

Verification: `npm run build`, `node tests/pet-roam.mjs`, `node tests/experience.mjs`, `node tests/showcase.mjs`, `node tests/story-ui.mjs`, `git diff --check`.

`tests/pet-roam.mjs` uses an explicitly labelled model fixture and real browser input. Tests visible exhaust, actual position change, pointer/focus reactions, idle invitation without focus theft, hide/pause/resume, modal suppression, phone overflow/text clearance and reduced motion. Screenshots and a recorded browser clip live under ignored `proof/pet/`.
