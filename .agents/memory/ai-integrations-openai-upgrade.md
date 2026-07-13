---
name: Replit AI Integrations OpenAI upgrade block
description: What to do when setupReplitAIIntegrations for OpenAI fails with awaiting_account_upgrade
---

`setupReplitAIIntegrations({ providerSlug: "openai" })` can fail with an `awaiting_account_upgrade` error, meaning the managed OpenAI proxy is not available on the current account/plan.

**Why:** This is an account-tier limitation, not a transient error — retrying the same setup call does not help.

**How to apply:** When this happens, don't loop on retrying the integration setup. Use `requestSecrets` to ask the user for their own `OPENAI_API_KEY` and wire the feature to the plain `openai` npm SDK reading `process.env.OPENAI_API_KEY` directly. If the user declines to provide a key, ship the feature in a genuinely degraded state (e.g. a real 503 from the endpoint with a clear message) rather than faking AI responses — do not silently mock the behavior.
