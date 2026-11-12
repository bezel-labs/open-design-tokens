---
"open-design-tokens": minor
---

`extensions-schema` fields accept `unique: true`. Each string value (or each item of a string array) may then appear only once across the document, and a repeat is reported as `extensions-schema.duplicate` on every token that uses it.
