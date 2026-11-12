import type { IssuePath, Severity, ValidationIssue } from '../core/issue.js';
import type { NodeInfo, PreparedDocument } from '../core/prepare.js';
import type { ValidationResult } from '../validator/result.js';
import type { Resolver } from '../validator/specs/2025.10/aliases/resolver.js';
import type { MessageCatalog } from '../validator/specs/2025.10/messages.js';

/** A lint diagnostic: a validation issue plus the rule that produced it. */
export interface LintIssue extends ValidationIssue {
  ruleId: string;
}

/** What a rule passes to `report`; the engine fills in code prefix, severity, and message escaping. */
export interface RuleReport {
  /** Optional suffix appended to the rule id: `token-name-length.too-short`. */
  code?: string;
  message: string;
  path: IssuePath | readonly string[];
  meta?: Record<string, unknown>;
}

/** Severity as written in a config; `off` disables the rule. */
export type RuleSeverity = Severity | 'off';

/** `'error'`, `['warning', { ...options }]`, or `'off'`. */
export type RuleSetting<Options = unknown> = RuleSeverity | readonly [RuleSeverity, Options];

export interface LintConfig {
  /** Presets to start from; later entries win, then `rules` overrides. */
  extends?: readonly PresetName[];
  rules?: Record<string, RuleSetting>;
}

export type PresetName = 'recommended';

/** Edges of the reference graph: alias/`$ref` source token → resolved target tokens. */
export interface ReferenceGraph {
  /** Every token pointer that is referenced by at least one alias or `$ref`. */
  referenced: ReadonlySet<string>;
  /** For each token pointer, the pointers it references directly. */
  outgoing: ReadonlyMap<string, readonly string[]>;
}

export interface LintContext<Options = unknown> {
  doc: PreparedDocument;
  resolver: Resolver;
  validation: ValidationResult;
  references: ReferenceGraph;
  options: Options;
  /** True when the validator reported an error at or below this pointer. */
  isInvalid(pointer: string): boolean;
  report(issue: RuleReport): void;
}

export interface RuleVisitor {
  token?(node: NodeInfo): void;
  group?(node: NodeInfo): void;
  /** Called once after every node; use for document-wide checks. */
  document?(): void;
}

export interface RuleMeta<Options> {
  description: string;
  /** Included in the `recommended` preset. */
  recommended?: boolean;
  defaultSeverity: RuleSeverity;
  /** Default options, merged under user options. */
  defaultOptions?: Options;
  /** Returns a message when `options` are malformed; the engine then throws (programmer error). */
  validateOptions?(options: unknown): string | undefined;
}

export interface LintRule<Options = unknown> {
  /** Flat kebab-case id, e.g. `token-name-length`. */
  id: string;
  meta: RuleMeta<Options>;
  create(ctx: LintContext<Options>): RuleVisitor;
}

export interface SkippedCheck {
  ruleId: string;
  pointer: string;
  reason: string;
}

export interface LintResult {
  /** `validation.valid` and no lint errors. */
  valid: boolean;
  issues: LintIssue[];
  errors: LintIssue[];
  warnings: LintIssue[];
  /** Rule/node pairs skipped because the validator flagged the node. */
  skipped: SkippedCheck[];
  validation: ValidationResult;
}

export interface ResolvedRule {
  rule: LintRule;
  severity: Severity;
  options: unknown;
}

export interface ResolvedConfig {
  rules: readonly ResolvedRule[];
}

/** The `meta` each built-in rule code reports, keyed by its full code. */
export interface RuleIssueMeta {
  'token-name-length.too-short': { length: number; min: number };
  'token-name-length.too-long': { length: number; max: number };
  'group-name-length.too-short': { length: number; min: number };
  'group-name-length.too-long': { length: number; max: number };
  'description-length.too-short': { length: number; min: number };
  'description-length.too-long': { length: number; max: number };
  'naming-convention.mismatch': { name: string; expected: string };
  'extensions-allowed-vendors.unknown-vendor': { key: string; allowed: string[] };
  'extensions-schema.not-object': Record<string, never>;
  'extensions-schema.missing': { field: string };
  'extensions-schema.unknown-field': { field: string };
  'extensions-schema.duplicate': { field: string; value: string; paths: string[] };
  'extensions-schema.wrong-type': { expected?: string; actual?: string };
  'extensions-schema.pattern': Record<string, never>;
  'extensions-schema.too-short': Record<string, never>;
  'extensions-schema.too-long': Record<string, never>;
  'extensions-schema.too-small': Record<string, never>;
  'extensions-schema.too-large': Record<string, never>;
  'extensions-schema.too-few': Record<string, never>;
  'extensions-schema.too-many': Record<string, never>;
  'extensions-schema.invalid': Record<string, never>;
  'require-description.missing': Record<string, never>;
  'require-explicit-type.inherited': { inheritedType: string | undefined };
  'no-empty-groups.empty': Record<string, never>;
  'max-alias-depth.exceeded': { hops: number; max: number; chain: string[] };
  'no-unused-tokens.unreferenced': Record<string, never>;
  'no-deprecated-alias.target': { target: string };
}

/** Message wording for built-in rule codes, each a function of that code's `meta`. */
export type RuleMessageCatalog = {
  [C in keyof RuleIssueMeta]: (meta: RuleIssueMeta[C]) => string;
};

/** Presentation options for a linter; none of them change what is reported. */
export interface LinterOptions {
  /**
   * Message wording by issue code, for validator codes (see `ValidateOptions.messages`) and
   * built-in rule codes. Codes not listed keep the built-in text.
   */
  messages?: Partial<MessageCatalog & RuleMessageCatalog>;
}

/**
 * A configured linter. Create one with `createLinter` and reuse it for every
 * document: the config is resolved once, when the linter is created.
 */
export interface Linter {
  /** Validates against the spec, then runs the configured rules. Never throws on document input. */
  lint(input: unknown): LintResult;
  /** The resolved configuration: the rules that run, each with its severity and merged options. */
  config: ResolvedConfig;
}
