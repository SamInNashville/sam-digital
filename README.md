# Sam Digital — Signal redesign

Source branch: `redesign/vgpu-signal`. Based on the published `SamInNashville/sam-digital` repository. The older dirty checkout at `/Users/sam/clawd/sam-digital-site` was not modified.

## Run

Node 22.12+ (or compatible Vite-supported Node). Dependencies pinned in package-lock.json.

```sh
npm ci --ignore-scripts
npm run build
npm run preview -- --port 4178 --strictPort
```

Open http://127.0.0.1:4178/sam-digital/ . Development: `npm run dev`.

## Verify

With the preview server running and Google Chrome installed:

```sh
node tests/smoke.mjs
```

Tests launch real Chrome with real WebGPU, not a mocked renderer. Results and screenshots go in `proof/`. GPU initialization has a bounded cold-start timeout. Accessibility checks use axe against WCAG 2 A/AA and 2.1 AA rules; they are automated checks, not a certification or replacement for screen-reader testing.

## Interaction-specific verification

With `npm run dev -- --port 4180 --strictPort` running:

```sh
node tests/evolution.mjs
```

This uses the production renderer with fixed times and pointer states, compares real GPU pixels, and writes a contact sheet. It proves pointer deformation independently of idle animation. With the built preview on port 4178:

```sh
node tests/interaction.mjs
node tests/performance.mjs
# Optional bounded actual browser recording:
RECORD_VIDEO=1 node tests/interaction.mjs
```

The performance probe compares active rendering to the same browser's paused requestAnimationFrame baseline; a slow test host is not proof of a slow shader. The indexed rasterization version matched approximately 20 fps available in one paired test. This is measured test-host throughput, not a guarantee for every device. Browser automation/video capture lowers measured throughput further.

## Structure

- `index.html`: semantic, server-independent content and a JS-free inline SVG fallback.
- `src/style.css`: responsive copper/ivory/charcoal visual system. Google Fonts uses `display=swap` and system fallbacks.
- `src/main.js`, `src/contact.js`: service preselection and a safely encoded mailto draft. No server, form submission, tracking, or automatic email sending. The optional form is hidden when JS is unavailable; the direct email link remains usable.
- `src/signal.js`, `src/signal-renderer.js`, `src/signal.wgsl`: genuine vgpu 0.4.1 / WebGPU indexed parametric copper sculpture. Continuous deformation, cursor attraction, inertial drag rotation, movement-reactive highlights/sparks, and click/tap pulses. Depth testing, 4× MSAA, and bloom composition; 30 fps ceiling, max 640×640 buffer, offscreen/background suspension, pause/resume, and reduced-motion support. Keyboard: focus sculpture; arrows rotate, Enter/Space pulse, Escape resets. Save-Data skips GPU loading. GPU errors revert to the static artwork without affecting content.
- `nav.js`, `particles.js`, `scroll.js`: legacy originals retained for reference, not imported or shipped in `dist`.

The GPU module is lazy-loaded separately from the small contact/UI script. WebGPU requires HTTPS or localhost. Unsupported browsers get the SVG automatically. No WebGPU polyfill and no backend dependencies.

## Publishing — approval required

The first redesign was published in main commit `e8873cb`; the evolving-sculpture upgrade is locally verified and awaiting its publication approval. `dist/` is the deployable static site; source `index.html` is NOT a drop-in Pages deployment because its module imports require the Vite build. The Vite base is `/sam-digital/` for the existing GitHub Pages path.

After approval, the verified current Pages source is the root of `main` (`build_type: legacy`). Publish the contents of `dist` to that publishing root, or explicitly approve changing Pages to a build workflow. Preserve the prior published commit for rollback. Verify the remote page and hashed JS/CSS assets after publishing. Do not publish `node_modules`, test proof, or source-only files.

## Content decisions

The existing services, email address, Nashville location, fixed-quote positioning, and 40-year experience claim were retained. Copy was tightened for review. No invented client logos, testimonials, case studies, or project outcome metrics. The uncommitted older checkout included a placeholder portfolio GitHub URL; it was deliberately not imported into this redesign.
