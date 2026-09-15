# Adaptive story interview — implementation notes

## Shipped in this pass

- Browser-local Qwen 2.5 3B (WebLLM), worker-isolated; no paid inference API. The 1.5B model was rejected for this richer interview after actual-browser tests exposed repeated answers and unreliable structured output.
- Separate conversational and evidence-selection passes. Grammar-constrained JSON only for selecting source sentence IDs; normal conversation remains natural text.
- Readiness checks outcome, intended people, starting point and concrete better experience. Evidence references exact visitor text and turn indices. Conservative lexical checks reject obvious mismatches; an explicit current-state sentence can supply a missed starting-point candidate. This is heuristic readiness, not proven semantic understanding.
- At readiness, offer a human email handoff without terminating the conversation. No fixed turn limit. Exact/resembling repeated questions, repeated visitor input, identical repeated replies, malformed output and detected uncertainty trigger handoff.
- Technical questions and common commercial-promise patterns are checked before display; one question maximum per reply. Prompt and pattern guards reduce risk but do not prove universal model compliance or perfect uncertainty detection.
- Explicit corrections clear older evidence conservatively. Original turns are never overwritten; readers see corrections in context.
- Every email link carries the complete visitor/guide archive, optional notes and unsent draft. Header contact opens review. Review offers copy and a downloadable full-text record. No sending endpoint or delivery confirmation was added.
- Records have a UUID, ordered timestamps and topic identifiers. sessionStorage restores this tab after refresh; New topic retains the prior story in the archive. Clear saved conversation is explicit. Storage failure is surfaced. Download is the durable portable copy; browser-tab storage is not a server archive and not guaranteed after closing the tab.
- Long mailto drafts may exceed email-client limits. The page warns and provides complete copy/download alternatives. Visitor must check the draft before sending.
- Footer service summaries start the local AI conversation with keyboard/click, while no-JS descriptions remain available.
- Cloud-only renderer unchanged. Send Request stays visible. Fixed-quote footer removed.

## Verification

Run from this checkout with its preview server on 4183:

```
npm run build
node tests/story-policy.mjs
node tests/story-ui.mjs
node tests/story-real.mjs
node tests/thinking-preview.mjs
BASE_URL=http://127.0.0.1:4183/sam-digital/ node tests/concierge-visual.mjs
```

`story-ui` uses explicit model fixtures and real browser UI. It covers productive interviews beyond three turns, readiness, uncertainty, repeat questions, direct human requests, full email/archive/download, reload recovery, new-topic preservation, all four footer routes, responsiveness, accessibility and unavailable GPU.
`story-real` runs the actual downloaded 3B model: company question, vague website request, concrete booking story, added detail, corrected audience and price/date guarantee request. Results live in ignored `proof/story/` locally, not as customer data in Git.

## Known limits

- A larger initial model download and device-memory requirement; unsupported devices retain human email review.
- Small local model wording/semantic extraction remain imperfect. Readiness is an optional suggestion, never a gate to contacting a person.
- Model context is bounded separately from the complete archive. It does not necessarily reason over every old turn; no original text is truncated from the human handoff.
- Local storage and mailto are not a hosted CRM, cross-device account, durable remote archive or verified delivery system.
- Earlier concierge fixture suites assume the retired raw-text protocol and old copy. The story suites supersede their interview/handoff assertions; renderer regression tests remain applicable.

Approved original checkpoint `milestone/user-story-contract-v1` remains unchanged. This implementation is a follow-up, not an amendment to that checkpoint.
