import { describe, expect, it } from 'vitest';
import { createLinter, resolveConfig } from '../../src/linter/index.js';
import { ISSUE_CODES, validateDtcg } from '../../src/validator/index.js';

const lint = (input: unknown, config?: Parameters<typeof createLinter>[0]) =>
  createLinter(config).lint(input);

describe('lint engine', () => {
  it('always validates first and gates rules on invalid nodes', () => {
    const doc = { bad: { $type: 'number', $value: 'x' }, ok: { $type: 'number', $value: 1 } };
    const r = lint(doc, { rules: { 'require-description': 'error' } });
    expect(r.valid).toBe(false);
    expect(r.validation.errors.map((i) => i.code)).toEqual(['number.value.not-number']);
    expect(r.issues.map((i) => i.path.pointer)).toEqual(['/ok']);
    expect(r.skipped).toEqual([
      { ruleId: 'require-description', pointer: '/bad', reason: 'node has validation errors' },
    ]);
  });

  it('valid means spec-valid and no lint errors; warnings do not fail', () => {
    const doc = { t: { $type: 'number', $value: 1 } };
    expect(lint(doc, { rules: { 'require-description': 'warning' } }).valid).toBe(true);
    expect(lint(doc, { rules: { 'require-description': 'error' } }).valid).toBe(false);
  });

  it('validation output is identical with and without a lint config', () => {
    const doc = { a: { $type: 'number', $value: 'x' }, b: { $value: '{a}' }, c: {} };
    const plain = validateDtcg(doc);
    const linted = lint(doc, {
      extends: ['recommended'],
      rules: { 'token-name-length': ['error', { min: 3 }] },
    }).validation;
    expect(linted).toEqual(plain);
  });

  it('never emits a validator issue code from a rule', () => {
    const doc = { a: { $type: 'number', $value: 1 }, g: {} };
    const r = lint(doc, {
      extends: ['recommended'],
      rules: {
        'require-description': 'error',
        'require-explicit-type': 'error',
        'naming-convention': ['error', { tokens: 'pascal' }],
      },
    });
    const validatorCodes = new Set<string>(ISSUE_CODES);
    for (const i of r.issues) expect(validatorCodes.has(i.code), i.code).toBe(false);
  });

  it('does not run rules on unparsable or non-object input', () => {
    expect(lint('{', { rules: { 'require-description': 'error' } }).issues).toEqual([]);
    expect(lint([], { rules: { 'require-description': 'error' } }).issues).toEqual([]);
  });

  it('a linter without a config only validates', () => {
    const linter = createLinter();
    expect(linter.config.rules).toEqual([]);
    const r = linter.lint({ a: { $type: 'number', $value: 1 }, g: {} });
    expect(r.issues).toEqual([]);
    expect(r.valid).toBe(true);
  });

  it('resolves the config once and exposes it', () => {
    const linter = createLinter({
      extends: ['recommended'],
      rules: { 'group-name-length': ['error', { min: 1, max: 20 }] },
    });
    const byId = Object.fromEntries(linter.config.rules.map((r) => [r.rule.id, r]));
    expect(byId['group-name-length']?.severity).toBe('error');
    expect(byId['group-name-length']?.options).toEqual({ min: 1, max: 20 });
    expect(byId['no-empty-groups']?.severity).toBe('warning');
    // The same resolved config is used for every document.
    const first = linter.lint({ g: {} });
    const second = linter.lint({ g: {} });
    expect(second.issues).toEqual(first.issues);
    expect(linter.config).toBe(linter.config);
  });

  it('passes message overrides through to the validator', () => {
    const linter = createLinter(
      {},
      { messages: { 'number.value.not-number': () => 'Numbers only.' } },
    );
    const r = linter.lint({ a: { $type: 'number', $value: 'x' } });
    expect(r.validation.errors.map((i) => i.message)).toEqual(['Numbers only.']);
    expect(r.validation.errors[0]?.code).toBe('number.value.not-number');
  });

  it('applies message overrides to rule codes, with the rule meta', () => {
    const linter = createLinter(
      { rules: { 'naming-convention': ['error', { groups: '^[a-z]+$' }] } },
      { messages: { 'naming-convention.mismatch': (m) => `Rename "${m.name}".` } },
    );
    const r = linter.lint({ 'Bad Name': { a: { $type: 'number', $value: 1 } } });
    expect(r.errors.map((i) => [i.code, i.message])).toEqual([
      ['naming-convention.mismatch', 'Rename "Bad Name".'],
    ]);
    expect(r.errors[0]?.meta).toEqual({ name: 'Bad Name', expected: 'pattern ^[a-z]+$' });
  });

  it('keeps built-in wording for rule codes without an override', () => {
    const linter = createLinter(
      { rules: { 'group-name-length': ['error', { max: 2 }] } },
      { messages: { 'naming-convention.mismatch': () => 'unused' } },
    );
    const r = linter.lint({ abc: { a: { $type: 'number', $value: 1 } } });
    expect(r.errors[0]?.message).toBe('Group name "abc" is 3 characters; maximum is 2.');
  });

  it('escapes control characters in overridden rule messages', () => {
    const linter = createLinter(
      { rules: { 'naming-convention': ['error', { groups: 'kebab' }] } },
      { messages: { 'naming-convention.mismatch': (m) => m.name } },
    );
    const r = linter.lint({ 'a\u001b[31m': { b: { $type: 'number', $value: 1 } } });
    expect(r.errors[0]?.message).not.toContain('\u001b');
    expect(r.errors[0]?.message).toContain('\\u001b');
  });

  it('reports a unique extension field value on every token that uses it', () => {
    const linter = createLinter(
      {
        rules: {
          'extensions-schema': [
            'error',
            {
              vendors: {
                'com.example.app': {
                  fields: { exportName: { type: 'array', items: 'string', unique: true } },
                },
              },
            },
          ],
        },
      },
      {
        messages: {
          'extensions-schema.duplicate': (m) => `${m.value} is taken by ${m.paths.join(', ')}.`,
        },
      },
    );
    const named = (names: string[]) => ({
      $type: 'number',
      $value: 1,
      $extensions: { 'com.example.app': { exportName: names } },
    });
    const r = linter.lint({ a: named(['x']), b: named(['x']), c: named(['y']) });
    expect(r.errors.map((i) => [i.path.dot, i.message, i.meta])).toEqual([
      [
        'a.$extensions.com.example.app.exportName',
        'x is taken by b.',
        { field: 'exportName', value: 'x', paths: ['b'] },
      ],
      [
        'b.$extensions.com.example.app.exportName',
        'x is taken by a.',
        { field: 'exportName', value: 'x', paths: ['a'] },
      ],
    ]);
  });

  it('presets apply first and explicit rules override', () => {
    const resolved = resolveConfig({
      extends: ['recommended'],
      rules: { 'no-empty-groups': 'off', 'max-alias-depth': ['error', { max: 1 }] },
    });
    const byId = Object.fromEntries(resolved.rules.map((r) => [r.rule.id, r]));
    expect(byId['no-empty-groups']).toBeUndefined();
    expect(byId['max-alias-depth']?.severity).toBe('error');
    expect(byId['max-alias-depth']?.options).toEqual({ max: 1 });
    expect(byId['no-unused-tokens']?.severity).toBe('warning');
  });

  it('rejects unknown rules, presets, bad severities, and malformed options at creation', () => {
    expect(() => createLinter({ rules: { nope: 'error' } })).toThrow(/Unknown lint rule/);
    // @ts-expect-error deliberate
    expect(() => createLinter({ extends: ['strict'] })).toThrow(/Unknown lint preset/);
    // @ts-expect-error deliberate
    expect(() => createLinter({ rules: { 'no-empty-groups': 'loud' } })).toThrow(/severity/);
    expect(() => createLinter({ rules: { 'token-name-length': ['error', { min: 'x' }] } })).toThrow(
      /min must be/,
    );
    expect(() =>
      createLinter({ rules: { 'naming-convention': ['error', { tokens: '(' }] } }),
    ).toThrow(/tokens:/);
  });

  it('escapes control characters in rule messages', () => {
    const r = lint(
      { 'a\u001b[31m': { $type: 'number', $value: 1 } },
      { rules: { 'naming-convention': ['error', { tokens: 'kebab' }] } },
    );
    expect(r.issues[0]?.code).toBe('naming-convention.mismatch');
    expect(r.issues[0]?.message).not.toContain('\u001b');
    expect(r.issues[0]?.message).toContain('\\u001b');
  });
});
