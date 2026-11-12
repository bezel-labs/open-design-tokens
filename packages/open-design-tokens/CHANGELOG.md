# open-design-tokens

## 0.6.0

### Minor Changes

- [#50](https://github.com/bezel-labs/open-design-tokens/pull/50) [`d1adabd`](https://github.com/bezel-labs/open-design-tokens/commit/d1adabdeee368c821182be944517cb259d1bd131) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - `createLinter`'s `messages` option now rewords lint rule messages as well as validator messages. Rule codes such as `naming-convention.mismatch` are typed by the new `RuleMessageCatalog` and `RuleIssueMeta` exports.

## 0.5.0

### Minor Changes

- [#35](https://github.com/bezel-labs/open-design-tokens/pull/35) [`15a2890`](https://github.com/bezel-labs/open-design-tokens/commit/15a2890b745fede22d9ab2b5dad9b99dfafff330) Thanks [@MyCapsLocked](https://github.com/MyCapsLocked)! - Add `open-design-tokens` as a second name for the `dtcg-lint` command, so `npx open-design-tokens tokens.json` keeps working if the package ever gains another command. `dtcg-lint` is unchanged.

## 0.4.0

### Minor Changes

- [#28](https://github.com/bezel-labs/open-design-tokens/pull/28) [`8ccbd1c`](https://github.com/bezel-labs/open-design-tokens/commit/8ccbd1cf10f9195e35249e2cc0c9a47dc35d30e3) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - Report an invalid name once. `name.forbidden-character` now lists every forbidden character the name contains in `meta.characters` (and in the message), instead of one issue per character. `meta.character` remains the first of them.

## 0.3.0

### Minor Changes

- [#26](https://github.com/bezel-labs/open-design-tokens/pull/26) [`41b353e`](https://github.com/bezel-labs/open-design-tokens/commit/41b353e4224b1a930a61a0f17954ea088099d6bd) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - Type each issue's `meta` by its `code` (`IssueMeta`, `SpecIssue`): `ValidationResult.issues` narrows on `code`, so clients can build their own messages or UI from the details without parsing the sentence. Shape errors now carry the offending value as `meta.actual` when it is a primitive, and their messages name it ("received the string "#zzz""); objects and arrays are still described by type only.

  Add `messages` to `ValidateOptions` and a second `createLinter(config, { messages })` argument: a partial catalog keyed by code that replaces the wording of those codes and nothing else.

## 0.2.0

### Minor Changes

- [#24](https://github.com/bezel-labs/open-design-tokens/pull/24) [`f21750b`](https://github.com/bezel-labs/open-design-tokens/commit/f21750b30a3ab509091e2bc9b552496bd0f6693d) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - Replace `lintDtcg(input, config, options)` with `createLinter(config)`, which resolves the config once and returns `{ lint, config }`. Configuration mistakes now throw when the linter is created rather than on the first document, and the resolved rules (with merged options) are readable from `linter.config`. `LintOptions` and the custom-rule loader are removed; a namespaced plugin contract is on the roadmap.

  Ship a CommonJS build next to the ESM one, with top-level `main` and `types` fields and `require` conditions, so the package resolves under `moduleResolution: node` and in CommonJS test runners.

  Add the `name.reserved-prefix` error: a `$`-prefixed group member that holds an object is a token or group whose name begins with `$`, which §5.1.1 forbids. A `$`-prefixed scalar is still reported as `group.property.unknown` (warning).

## 0.1.1

### Patch Changes

- [`6cabdc1`](https://github.com/bezel-labs/open-design-tokens/commit/6cabdc1e6f95f22a6c4485a28cb11318111e5d3a) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - Fix `dtcg-lint --no-color`, which exited with an unknown-option error instead of disabling colors.

## 0.1.0

### Minor Changes

- [`6bd2f64`](https://github.com/bezel-labs/open-design-tokens/commit/6bd2f645ed6e111adc14d9e5fe4fe5a8ab4e7438) Thanks [@mr-robot-o](https://github.com/mr-robot-o)! - First functional release: a DTCG 2025.10 validator covering every token type, groups, aliases, JSON pointer references, and group extension; a configurable linter with twelve rules and a recommended preset; the `dtcg-lint` CLI with pretty, JSON, and GitHub formatters; and full TypeScript types.
