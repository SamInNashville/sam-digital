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

## Content-led hover refinement

The opening now reads “Sam is here to help you.” Sam introduces himself with “I'm Sam! I'll guide you.” The old explanatory introduction is removed; privacy details and a tucked-away Hide Sam control remain. Perches derive from the active conversation/demo or the visible content section, rather than a right-edge fallback. Eye tracking remains unchanged. Smaller transparent-outline bubbles emit continuously while hovering, increase during travel, and stop under pause/reduced-motion/hide. Rendering is capped at 30 updates per second and a maximum 1800px canvas dimension. `tests/sam-hover.mjs` verifies the exact copy, sustained stationary emission, content-adjacent perch, gaze and pause.

## Playful personality refinement

- Increased downward ejection to 120px/s while hovering and 190px/s in flight, before inherited motion/drag/buoyancy. Bubble size and transparency are unchanged.
- Authored combinatorial phrase banks: 100 variations each for services, Breakout, design, chat encouragement and general asides; small additional banks for waiting, reply, idle and tickle moments. Context selection does not inspect visitor text. Sarcastic site/demo lines never come from the chat encouragement bank. Requested example lines are each context's first line.
- Roughly 10-second minimum spacing for automatic asides; a newly explored section can respond sooner; brief supportive input-focus exception with its own cooldown. Actual typing clears speech immediately. Nothing is inserted into the enquiry transcript. No extra model calls.
- Travel uses bounded curved keyframes, an occasional loop when space permits, and overshoot/settling. Ticklish proximity adds a short bounded dodge, mouse-only, cooled down, disabled while editing/paused. It never intercepts input.
- `tests/pet-dialogue.mjs`, `pet-flight.mjs`, `pet-context.mjs`, `pet-personality.mjs` and `pet-tickle.mjs` check banks/physics, geometry, exact contextual examples, rendered spontaneous chatter/flight, and real pointer proximity.

An optional model-fed aside could be added later as a non-blocking part of a completed conversational response, with length/safety validation and authored fallback. It is deliberately not connected in this release.

## Longer-lived speech refinement

Speech no longer expires on a short hide timer. It stays until a replacement line, movement to a new perch, or visitor intervention. Automatic asides replace the line after at least 10 seconds while not editing; new section arrivals can respond after 3.5 seconds. The scheduler checks once per second after 1.8 seconds of quiet. Pointer entry into the bubble's bounds clears it after a 600ms grace period; ordinary distant pointer motion still just tracks the visitor. Typing, clicks, keys, scrolling, pause/hide, dialogs and reduced motion clear or suppress speech. The one-time idle invitation waits until the current line has had eight seconds.

Slightly wider, rounded speech boxes use more vertical placement candidates and a lightweight pointer-transparent SVG tail to visibly anchor them to Sam. Tail and speech share lifecycle and disappear before flight. `tests/pet-speech.mjs` verifies longer greeting/section dwell, automatic replacement without a blank interval, mouse intervention, typing, services-heading clearance and mobile bounds. Browser AI inference remains untouched.

## Lazy parabolic motion (supersedes tight loops)

Trips now use 97 time-sampled points on one continuous parabola, with cosine-ramped back easing baked into the positions and linear browser interpolation. Long-distance duration scales from 2.3 seconds up to 4.2 seconds. A small elastic overshoot returns gently to the exact destination. Near boundaries the planner reduces arc/rebound instead of clipping samples into sharp corners. Tight loops are removed. Body lean transitions independently rather than snapping on/off.

Focus/hover destinations wait 650ms; scroll attention waits 850ms. An in-progress trip finishes before the latest pending destination is considered, so rapid activity does not continually cancel/restart animation. Resize/out-of-viewport correction and pause/hide remain immediate safety exceptions. Sub-18px perch adjustments stay put. Mouse dodge is slower and less frequent. Arrival encouragement compares last typing against the original focus event, not delayed departure, to avoid speaking over someone who began typing during the wait.

`tests/pet-lazy.mjs` verifies deferred departure, uninterrupted animation identity across new focus, latest-intent arrival and focus preservation. Planner tests now require parabolic rather than loop choreography; previous loop screenshots are historical.

## Coherent authored remarks (supersedes combinatorial banks)

Patrick approved the smooth movement and speech timing; this pass changes only wording. Cartesian opener/ending combinations are replaced by 32 individually authored complete remarks in each main context, plus the four existing small context categories: 176 total entries. Breadth is no longer inflated by unrelated sentence pairings. Approved first lines, selection/repetition logic, UI triggers, timing, flight, gaze, bubbles and actual assistant conversation are unchanged.

Every remark is reviewed in its own context without assuming access to score, selected palette, or visitor transcript. Dialogue tests enumerate the entire selectable catalog, check context isolation, unique main-bank entries, length and exact first lines. These are structural checks, not proof that a joke is funny; editorial review covers sense and tone. Browser context/speech tests verify the real display remains connected correctly.

## Readable speech and expanded personality

This supersedes mouse-approach dismissal and the earlier 10-second replacement interval. Ordinary remarks are eligible for replacement after 18 seconds. Incidental hover-driven movement, idle invitations and tickle dodges give a visible line at least 12 seconds before interrupting. Hovering over/near the bubble pins it and its perch; leaving allows four seconds of grace. These are pointer-transparent geometry checks, not an overlay that intercepts clicks. Explicit clicks, typing, keyboard focus changes, scroll, pause/hide, visibility and dialogs still clear/suppress speech. Stale arrival remarks are skipped when a newer destination is pending, preserving the approved smooth-flight behavior.

All nine authored banks are doubled exactly: five main banks contain 64 whole remarks each; four smaller banks contain eight each; 352 total. The site/demos and Sam himself get the jokes. Visitors get encouragement. No Cartesian sentence stitching is restored. While the input is focused and no typing has occurred since focus, the chat bank can keep offering supportive lines at the relaxed cadence. Typing silences that focus session, even if the visitor pauses to think. There is no transcript inspection or model change.

Tests enumerate all authored entries and assert exact counts in every bank. `pet-speech.mjs` checks incidental hover survival, pinning past the normal replacement interval, leave grace, explicit dismissal, replacement and mobile bounds. `pet-tickle.mjs` checks that reading takes priority over a dodge. `pet-encouragement.mjs` checks continued encouragement under focus and sustained silence after typing. Existing lazy-flight and companion checks protect motion and accessibility.
