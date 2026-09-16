# Browser-AI experience layer

## What changed

- Visible identity before typing: **Meet Dot. AI, not a human.** Reply labels identify Dot as browser AI. Human contact is explicitly the email handoff.
- Privacy explanation separates on-device inference and in-memory conversation from site/model downloads, model caching, and visitor-controlled email/copy/download. No new analytics, remote inference, form service, or data storage.
- Original WebGPU cloud shader remains unchanged. A deterministic connected neural overlay fires on submission, continues during a held response, fades afterward, and stops its frame loop at idle. It is decorative activity feedback, not claimed model internals. Pixel extent is capped, with 30fps maximum and pause/reduced-motion/hidden-page handling.
- Dot is an original SVG companion, with pointer-following eyes and listening/thinking/reply poses. Movement stays within a reserved perch so it cannot cover input or buttons. Hide/show is available.
- Gallery has real playable Breakout and an interactive design study (three palettes, two layouts). Both are labelled demos, not client work. No external assets or dependencies added.
- One motion control coordinates the cloud, network and companion. Manual global pause also pauses Breakout. OS reduced motion keeps decoration still but allows a game the visitor deliberately starts.

## Verification

- `tests/experience.mjs`: desktop/mobile identity, companion states/hide, neural pause, reduced motion, overflow, axe accessibility.
- `tests/experience-motion.mjs`: real WebGPU cloud with changing neural canvas pixels, moving companion, held-response activity, frozen pause, complete fade, and zero idle neural frame loop. Records `proof/experience/neural-companion.webm`. AI held by an explicit fixture; renderer is real.
- `tests/showcase.mjs`: actual integrated gallery; start/pause/restart, keyboard, global pause, palette/layout, narrow widths, accessibility, intentional game under reduced motion.
- `tests/breakout-physics.mjs`: executes the actual game with a virtual frame clock, follows rendered ball positions via pointer events, proves all bricks cleared (280 score), paddle bounces, loss and restart without injecting game state.
- `tests/privacy-real.mjs`: actual local-model generation, synthetic private marker absent from observed network URLs/bodies, no requests during the observed reply, full discussion present in email review. This is a bounded observation plus source inspection—not a guarantee about browser extensions or hosting-provider connection logs.
- Existing story UI and real GPU cloud tests preserved. Multi-canvas selectors now explicitly target the original cloud instead of assuming one canvas per page.

The assistant's conversational prompt and story policy are unchanged by this release. Mobile screenshots are browser-viewport tests, not a physical iPhone performance claim.
