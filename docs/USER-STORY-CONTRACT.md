# Sam Digital — approved user-story contract

## Approved visual baseline

Source: `7e3122961671f6b2e5e7e9e55ad5532a71bcb410`, tag `milestone/cloud-only-v1`.
Published build: `95d800b97769c715bbe41b2b8a8eddf0b0640f13`, tag `milestone/cloud-only-v1-live`.
Cloud-only background; no stars/particles. Working cloud motion reaches four times idle. Foreground preserved.

## Product purpose

The site collects user stories, not technical specifications. Ask ordinary people about the experience they want, what happens today, what gets in their way, who is affected and what would improve their lives. These are discovery themes, not a compulsory checklist. Never quiz visitors about stacks, APIs, architecture or implementation choices.

## Full-context record

Preserve original visitor wording and the complete ordered conversation, including guide questions, replies, corrections and explicitly supplied details. Summaries are secondary and must not replace the source record. Keep inferred interpretations distinguishable from visitor statements. Stories must be retrievable with their full surrounding context for human review.

Every email path must carry the full session story, discussion and collected details, not just the final question or an AI summary. Do not silently truncate. Preparing an email draft is not verified delivery. Do not claim durable storage, receipt or delivery without exercising the corresponding real path. Visitor information must not be stored in a public repository or captured remotely without appropriate disclosure and authorization.

## Uncertainty means email

When the browser-local LLM is unsure, lacks approved grounding or cannot answer reliably, acknowledge the limit and direct the visitor to Send Request for a human response by email. Do not guess, manufacture assurances, or conceal uncertainty behind another question loop.

Suggested copy: “I’m not sure, and I don’t want to give you the wrong answer. Send this conversation by email for a personal response.”

The visitor reviews and initiates the email; no silent sending. Carry the complete story and conversation so the visitor does not have to repeat themselves.

## Other standing constraints

- Keep Send Request prominent and discovery bounded, with an easy human handoff.
- Never ask for files/documents or promise prices, fixed quotes or delivery dates.
- Visitor budget preferences and desired timing are requests, not company commitments.
- Footer service prompts should enter the local AI conversation.
- Requested site refinements have standing publication approval after verification; this does not authorize spending, new external services or unrelated deployments.

## Implementation status

This document locks approved requirements, not completed functionality. The visual baseline is published. Full-context durable storage/retrieval, universal email payload preservation, nontechnical-question enforcement, footer AI routing and a reliable uncertainty-to-email gate require implementation and verification against the shipped site. Existing experimental intake work is separate; do not silently merge it into the approved baseline.

Source decisions: Patrick’s direct corrections in Hermes session `20260912_221010_b06e9a`. Changes after this checkpoint belong in follow-up commits, not amendments to the approved checkpoint.
