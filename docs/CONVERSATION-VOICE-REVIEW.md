# Conversation voice review

Requested direction: excited, encouraging, interested in the visitor's actual idea—not generic praise followed by an intake checklist. Preserve the approved visual design.

Changes:
- Warm, specific-observation guidance and examples; contextual mobile discovery remains guided, not unrestricted.
- Optional human invitation uses conversational language instead of announcing that enough information has been gathered.
- Accept `new` as starting-point evidence when the preceding question supplies its meaning.
- Retain previously validated visitor evidence across short replies. Explicit corrections invalidate earlier evidence; new topics do not inherit it.
- Mobile-specific guidance requires a mobile project, not merely the word `phone` (e.g. customers phoning a business).

Verification:
- `tests/scope-real.mjs` runs the reported domino / both / new conversation through the actual browser model and records raw inference alongside displayed replies in `proof/scope/real.json`.
- Policy test covers short-answer evidence and evidence retention.
- Story UI tests cover full email context, continued discussion, new topics, refresh reset, uncertainty, repetition, accessibility, and unsupported browsers.
- Broader real-model story test covers a website enquiry, readiness, more detail, correction and commercial uncertainty.

Limits: the small local model still generates generic praise and sometimes proposes a redundant question internally. The policy removes further discovery questions when source-backed readiness is established. Passing these tests is not proof of consistently excellent voice. Review the visible responses, not merely the exit code. No canned domino answer is substituted for model inference.
