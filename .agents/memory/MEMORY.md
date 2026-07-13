# Memory Index

- [Replit AI Integrations OpenAI upgrade block](ai-integrations-openai-upgrade.md) — `awaiting_account_upgrade` means fall back to `requestSecrets` for the user's own key, not retrying setup.
- [Orval query-param date coercion gap](orval-query-date-coercion.md) — some generated query-param Zod schemas use `zod.date()` instead of `zod.coerce.date()` and will fail on real string query params.
