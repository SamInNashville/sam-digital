# Sam Digital — conversation-first enquiry guide

Source branch: `redesign/conversation-first`. Public-site replacement requires approval. The old copper sculpture version remains preserved on `redesign/vgpu-signal` and in the existing publication worktree. The older dirty `/Users/sam/clawd/sam-digital-site` checkout is untouched.

## Run and verify

```sh
npm ci --ignore-scripts
npm run build
npm run preview -- --port 4178 --strictPort
# In another terminal:
node tests/concierge-ui.mjs
node tests/concierge-visual.mjs
node tests/concierge-real.mjs
```

Open http://127.0.0.1:4178/sam-digital/ . HTTPS or localhost is required for WebGPU. The real-model test uses an isolated Chrome profile at `/Users/sam/sam-digital-ai-test-profile` so downloaded model assets can be reused.

## Product contract

- Opening: exactly **How can I help you?**, a text composer and five clickable common company/project questions.
- A two-second CSS intro runs independently of model startup. Reduced motion bypasses the animation. The inline intro timer does not depend on model readiness; JavaScript-free users retain the company information and direct email.
- Model preparation starts on module initialization. A compatible, ready browser-native model is preferred; otherwise a Web Worker loads Qwen 2.5 1.5B through pinned `@mlc-ai/web-llm@0.2.85`. No API keys, cloud inference, company-code imports, telemetry or automatic enquiry submission.
- Initial model downloads can take substantially longer than the intro. The user can type or click a question immediately; requests wait for readiness. **Researching your request** appears after submission, with honest loading detail if generation has not started.
- vgpu 0.4.1 renders procedural ethereal smoke while idle. Submitted requests illuminate a decorative synapse graph with moving light pulses. The graph represents UI activity, not actual model internals. It settles after completion; static gradients remain if WebGPU fails.
- Background resolution is capped to a 560px longest edge, at about 12 fps idle / 8 fps during a request, with pause, hidden-tab suspension and reduced-motion support. Inference runs separately in a worker, but both still share hardware resources.
- AI scope: basic company facts and a helpful path toward a real human-reviewed job request. One relevant follow-up at a time. No invented prices, guaranteed timelines, live research, access to customer systems, or promises to perform work in chat.
- Follow-up buttons cover service categories and selected tool, volume and timing questions. Text entry always remains available.
- The editable enquiry uses the visitor's own messages, not a binding AI-written specification. Opening a mailto draft does not send it. No messages are persisted by the application; model assets are browser-cached.

## Implementation

`index.html`, `src/concierge.css`: new prompt-first presentation.
`src/concierge.js`: conversation UI, common/follow-up buttons, pending/cancellation state, editable enquiry and encoded mailto.
`src/local-assistant.js`: authored company instructions, native/worker routing and lifecycle.
`src/concierge-worker.js`: WebLLM loading, one-token warm-up, bounded streaming replies.
`src/atmosphere.js`, `src/atmosphere.wgsl`: actual vgpu smoke and synapse rendering.

The uploaded Cogility mini-ai package was inspected as architectural guidance. Its restricted package source and dependencies were not copied into this public-site implementation.

## Evidence and limitations

- `tests/concierge-ui.mjs`: 17 deterministic UI checks using an explicitly mocked model worker. This verifies intro timing, eager initialization, all five initial buttons, follow-up buttons, queued/loading/stopped requests, editable Unicode mail drafts, responsive layout, automated accessibility, unavailable-GPU and no-JS paths. It does NOT prove model correctness.
- `tests/concierge-visual.mjs`: real vgpu pixel changes for smoke and travelling signals, stable pause, reduced motion and mobile. Only the model response is held as an explicit fixture.
- `tests/concierge-real.mjs`: genuine local model download, warm-up and three generated answers. No fixture responses. Results/screenshots are in `proof/concierge/`.
- The first 0.5B candidate was rejected after producing inappropriate quote/task-execution language. The 1.5B candidate's reviewed test answers respected the price/date boundary and asked which tools were involved in an automation job.
- One measured cold 1.5B startup was 18,450ms, with full replies taking 877–2,264ms. These are test-host observations, not a two-second loading guarantee or device-independent performance claim.
- Model correctness is probabilistic. The reviewed questions are not a comprehensive adversarial certification. Native/browser compatibility and cold downloads remain device-dependent. Full automatic sending and a hosted inference fallback are not implemented.
- Recent context sent to the worker is bounded; the full visible user enquiry remains reviewable. Start fresh clears the in-memory chat.
- Earlier sculpture tests remain historical; they do not describe the new entrypoint.

## Publishing

The existing GitHub Pages setup serves the root of `main` (`legacy`). Build with Vite's `/sam-digital/` base and publish `dist` only after approval. Do not publish source, the mini-ai archive, browser profiles, node_modules or test proof. Preserve the previous publication commit for rollback. Verify the deployed HTML/assets and run the UI/visual tests against `BASE_URL` after deployment.
