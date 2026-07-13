---
name: Orval query-param date coercion gap
description: Some Orval-generated query-param Zod schemas don't coerce date strings, breaking server-side validation
---

For OpenAPI query parameters typed as `string, format: date`, Orval's generated Zod `...QueryParams` schema sometimes emits `zod.date()` instead of `zod.coerce.date()` — even though body/path date fields in the same generated file correctly use `zod.coerce.date()`.

**Why:** `zod.date()` only accepts an actual `Date` instance, but Express query params always arrive as strings. Using the generated `QueryParams` schema directly on `req.query` for these fields fails validation even for well-formed `YYYY-MM-DD` values.

**How to apply:** For query-param date/date-range fields specifically, validate manually server-side (e.g. a small regex-based `parseDateParam` helper) instead of trusting the generated `...QueryParams` schema. Other date fields (body, path, response) generated correctly with `zod.coerce.date()` and don't need this workaround. Worth double-checking the generated file after codegen rather than assuming all date fields coerce consistently.
