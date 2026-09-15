# Simplify the AI demo

Patrick's acceptance criterion: this conversation demonstrates the ability to harness AI. Cold and boring fails; warm and exploratory wins. Back off instruction layers rather than accumulating narrow repairs.

This revision removes the scripted next-question helper, per-turn evidence-area instructions, embedded example conversation, automatic question-count trimming, readiness-based question removal, and technical-keyword response rejection. The conversational prompt is a short role brief with company facts and business/privacy/truthfulness boundaries. Evidence tracking and full original email context remain separate from the conversation.

Tests verify safety-related handoffs, source evidence, original conversation retention, refresh reset and accessibility. Real-model tests exercise varied opening messages and follow-up details without enforcing a device/new-project question sequence. Raw and displayed replies are recorded together. Voice quality requires reading the replies; a passing structural test is not proof of a compelling demonstration.

Supersedes the scripted scope and question-removal parts of CONVERSATION-VOICE-REVIEW.md. The model can still ask weak or premature questions; the approach here is deliberately less scripted, not a claim that those weaknesses are solved.
