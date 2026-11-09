import { createLinter, type LintResult } from 'open-design-tokens/linter';
import { type ValidationResult, validateDtcg } from 'open-design-tokens/validator';
import { useEffect, useMemo, useState } from 'react';
import type { Row } from '../components/issue-list.js';
import { createPositionIndex } from './positions.js';

/** Inputs above this size are refused before parsing. */
const MAX_INPUT_BYTES = 2 * 1024 * 1024;

const LINTER = createLinter({ extends: ['recommended'] });

/** Validates, and optionally lints, a token file shortly after it stops changing. */
export function useTokenCheck(source: string, lintEnabled: boolean) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [lintResult, setLintResult] = useState<LintResult | null>(null);
  const [tooLarge, setTooLarge] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (source.length > MAX_INPUT_BYTES) {
        setTooLarge(true);
        setResult(null);
        setLintResult(null);
        return;
      }
      setTooLarge(false);
      if (lintEnabled) {
        const r = LINTER.lint(source);
        setLintResult(r);
        setResult(r.validation);
      } else {
        setLintResult(null);
        setResult(validateDtcg(source));
      }
    }, 150);
    return () => clearTimeout(handle);
  }, [source, lintEnabled]);

  const positions = useMemo(() => createPositionIndex(source), [source]);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [];
    for (const issue of result?.issues ?? []) out.push({ issue, source: 'validator' });
    for (const issue of lintResult?.issues ?? []) out.push({ issue, source: 'linter' });
    return out;
  }, [result, lintResult]);

  const errors = (result?.errors.length ?? 0) + (lintResult?.errors.length ?? 0);
  const warnings = (result?.warnings.length ?? 0) + (lintResult?.warnings.length ?? 0);
  const valid = lintResult ? lintResult.valid : (result?.valid ?? true);

  return { result, lintResult, tooLarge, positions, rows, errors, warnings, valid };
}
