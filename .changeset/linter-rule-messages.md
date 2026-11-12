---
"open-design-tokens": minor
---

`createLinter`'s `messages` option now rewords lint rule messages as well as validator messages. Rule codes such as `naming-convention.mismatch` are typed by the new `RuleMessageCatalog` and `RuleIssueMeta` exports.
