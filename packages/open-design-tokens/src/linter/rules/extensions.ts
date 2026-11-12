import { formatValue } from '../../core/issue.js';
import { isPlainObject } from '../../core/predicates.js';
import { defineRule } from '../define.js';
import type { LintContext, RuleReport } from '../types.js';

export interface AllowedVendorsOptions {
  /** Vendor keys that may appear in $extensions. */
  vendors: readonly string[];
}

export const extensionsAllowedVendors = defineRule<AllowedVendorsOptions>({
  id: 'extensions-allowed-vendors',
  meta: {
    description: 'Only listed vendor keys may appear in $extensions.',
    defaultSeverity: 'warning',
    defaultOptions: { vendors: [] },
    validateOptions: (o) =>
      isPlainObject(o) && Array.isArray(o.vendors) && o.vendors.every((v) => typeof v === 'string')
        ? undefined
        : 'vendors must be an array of strings',
  },
  create(ctx) {
    const allowed = new Set(ctx.options.vendors);
    const visit = (node: { path: readonly string[]; raw: Record<string, unknown> }) => {
      const ext = node.raw.$extensions;
      if (!isPlainObject(ext)) return;
      for (const key of Object.keys(ext)) {
        if (!allowed.has(key)) {
          ctx.report({
            code: 'unknown-vendor',
            message: `$extensions key ${formatValue(key)} is not an allowed vendor.`,
            path: [...node.path, '$extensions', key],
            meta: { key, allowed: [...allowed] },
          });
        }
      }
    };
    return { token: visit, group: visit };
  },
});

/** A declarative shape for one vendor's extension block. */
export interface FieldSchema {
  fields: Record<string, FieldSpec>;
  /** Allow fields not listed in `fields` (default false). */
  additionalFields?: boolean;
}

export interface FieldSpec {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  /** For strings: must match. For arrays: applies to each string item. */
  pattern?: RegExp;
  /** For strings and arrays: length bounds. For numbers: value bounds. */
  min?: number;
  max?: number;
  /** For arrays: item type. */
  items?: 'string' | 'number' | 'boolean' | 'object';
  /** Custom check; return a message to report. */
  validate?(value: unknown): string | undefined;
  /**
   * For strings and arrays of strings: each value may appear only once across the document,
   * in this field of this vendor block.
   */
  unique?: boolean;
}

/** A vendor check: a declarative schema, or a function returning reports. */
export type VendorCheck = FieldSchema | ((value: unknown, path: readonly string[]) => RuleReport[]);

export interface ExtensionsSchemaOptions {
  vendors: Record<string, VendorCheck>;
}

function typeOf(v: unknown): FieldSpec['type'] | 'null' | 'undefined' {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  const t = typeof v;
  return t === 'string' || t === 'number' || t === 'boolean' || t === 'object' ? t : 'undefined';
}

function checkField(
  value: unknown,
  spec: FieldSpec,
  path: readonly string[],
  report: LintContext['report'],
): void {
  const t = typeOf(value);
  if (t !== spec.type) {
    report({
      code: 'wrong-type',
      message: `Expected ${spec.type}, received ${t}.`,
      path,
      meta: { expected: spec.type, actual: t },
    });
    return;
  }
  if (typeof value === 'string') {
    if (spec.pattern && !spec.pattern.test(value))
      report({
        code: 'pattern',
        message: `${formatValue(value)} does not match ${String(spec.pattern)}.`,
        path,
      });
    if (spec.min !== undefined && value.length < spec.min)
      report({
        code: 'too-short',
        message: `${formatValue(value)} is shorter than ${spec.min}.`,
        path,
      });
    if (spec.max !== undefined && value.length > spec.max)
      report({
        code: 'too-long',
        message: `${formatValue(value)} is longer than ${spec.max}.`,
        path,
      });
  } else if (typeof value === 'number') {
    if (spec.min !== undefined && value < spec.min)
      report({ code: 'too-small', message: `${value} is below ${spec.min}.`, path });
    if (spec.max !== undefined && value > spec.max)
      report({ code: 'too-large', message: `${value} is above ${spec.max}.`, path });
  } else if (Array.isArray(value)) {
    if (spec.min !== undefined && value.length < spec.min)
      report({ code: 'too-few', message: `Expected at least ${spec.min} items.`, path });
    if (spec.max !== undefined && value.length > spec.max)
      report({ code: 'too-many', message: `Expected at most ${spec.max} items.`, path });
    value.forEach((item, i) => {
      const ipath = [...path, String(i)];
      if (spec.items && typeOf(item) !== spec.items) {
        report({
          code: 'wrong-type',
          message: `Expected ${spec.items}, received ${typeOf(item)}.`,
          path: ipath,
        });
      } else if (typeof item === 'string' && spec.pattern && !spec.pattern.test(item)) {
        report({
          code: 'pattern',
          message: `${formatValue(item)} does not match ${String(spec.pattern)}.`,
          path: ipath,
        });
      }
    });
  }
  const custom = spec.validate?.(value);
  if (custom) report({ code: 'invalid', message: custom, path });
}

export const extensionsSchema = defineRule<ExtensionsSchemaOptions>({
  id: 'extensions-schema',
  meta: {
    description: 'Vendor blocks in $extensions match a declared shape.',
    defaultSeverity: 'error',
    defaultOptions: { vendors: {} },
    validateOptions: (o) =>
      isPlainObject(o) && isPlainObject(o.vendors)
        ? undefined
        : 'vendors must be an object keyed by vendor',
  },
  create(ctx) {
    const uses = new Map<
      string,
      { field: string; value: string; owner: string; path: string[] }[]
    >();
    const recordUnique = (
      vendor: string,
      field: string,
      value: unknown,
      owner: readonly string[],
      path: readonly string[],
    ) => {
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        if (typeof v !== 'string') continue;
        const key = JSON.stringify([vendor, field, v]);
        const list = uses.get(key) ?? [];
        list.push({ field, value: v, owner: owner.join('.'), path: [...path] });
        uses.set(key, list);
      }
    };
    const visit = (node: { path: readonly string[]; raw: Record<string, unknown> }) => {
      const ext = node.raw.$extensions;
      if (!isPlainObject(ext)) return;
      for (const [vendor, check] of Object.entries(ctx.options.vendors)) {
        if (!(vendor in ext)) continue;
        const value = ext[vendor];
        const base = [...node.path, '$extensions', vendor];
        if (typeof check === 'function') {
          for (const r of check(value, base)) ctx.report(r);
          continue;
        }
        if (!isPlainObject(value)) {
          ctx.report({
            code: 'not-object',
            message: `${formatValue(vendor)} block must be an object.`,
            path: base,
          });
          continue;
        }
        for (const [field, spec] of Object.entries(check.fields)) {
          if (!(field in value)) {
            if (spec.required)
              ctx.report({
                code: 'missing',
                message: `Missing required field ${formatValue(field)}.`,
                path: base,
                meta: { field },
              });
            continue;
          }
          checkField(value[field], spec, [...base, field], ctx.report);
          if (spec.unique) recordUnique(vendor, field, value[field], node.path, [...base, field]);
        }
        if (!check.additionalFields) {
          for (const key of Object.keys(value)) {
            if (!(key in check.fields))
              ctx.report({
                code: 'unknown-field',
                message: `Unknown field ${formatValue(key)}.`,
                path: [...base, key],
                meta: { field: key },
              });
          }
        }
      }
    };
    const reportDuplicates = () => {
      for (const list of uses.values()) {
        if (list.length < 2) continue;
        for (const use of list) {
          const others = list.filter((other) => other !== use).map((other) => other.owner);
          ctx.report({
            code: 'duplicate',
            message: `${formatValue(use.field)} value ${formatValue(use.value)} is also used at ${others.map((o) => formatValue(o)).join(', ')}.`,
            path: use.path,
            meta: { field: use.field, value: use.value, paths: others },
          });
        }
      }
    };
    return { token: visit, group: visit, document: reportDuplicates };
  },
});
