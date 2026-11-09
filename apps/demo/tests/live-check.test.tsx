import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createLinter } from 'open-design-tokens/linter';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveCheck } from '../src/components/live-check.js';
import { LIVE_SAMPLES } from '../src/lib/live-samples.js';

describe('live samples', () => {
  const linter = createLinter({ extends: ['recommended'] });

  it.each(LIVE_SAMPLES)('$label reports exactly what it claims', ({ source, expect: codes }) => {
    const result = linter.lint(source);
    const reported = [
      ...result.validation.issues.map((issue) => issue.code),
      ...result.issues.map((issue) => issue.ruleId),
    ];
    expect(reported).toEqual(codes);
  });
});

describe('LiveCheck', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const settle = () => act(() => vi.advanceTimersByTime(200));
  const editor = () => screen.getByLabelText('tokens.json') as HTMLTextAreaElement;
  const pressed = () =>
    screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-pressed') === 'true')
      .map((button) => button.textContent);

  it('opens on a sample with a real error', () => {
    render(<LiveCheck />);
    settle();
    expect(pressed()).toEqual(['Color']);
    expect(screen.getByRole('status').textContent).toContain('Invalid');
    expect(screen.getByRole('status').textContent).toContain('1 error ');
    expect(screen.getByText('color.color-space.invalid')).toBeTruthy();
  });

  it('loads another sample and checks it', () => {
    render(<LiveCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Valid' }));
    settle();
    expect(pressed()).toEqual(['Valid']);
    expect(screen.getByRole('status').textContent).toContain('Valid');
    expect(screen.getByRole('status').textContent).toContain('0 errors');
  });

  it('shows lint findings with the validator results', () => {
    render(<LiveCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Lint' }));
    settle();
    expect(screen.getByText('no-empty-groups')).toBeTruthy();
  });

  it('clears the editor and focuses it for pasting, with no error on the empty file', () => {
    render(<LiveCheck />);
    settle();
    fireEvent.click(screen.getByRole('button', { name: 'Paste yours' }));
    settle();
    expect(editor().value).toBe('');
    expect(document.activeElement).toBe(editor());
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText(/Results appear here/)).toBeTruthy();
  });

  it('checks a pasted file and stays on Paste yours', () => {
    render(<LiveCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Paste yours' }));
    fireEvent.change(editor(), { target: { value: '{ "a": ' } });
    settle();
    expect(pressed()).toEqual(['Paste yours']);
    expect(screen.getByText('document.invalid-json')).toBeTruthy();
  });

  it('drops the sample choice once its text is edited', () => {
    render(<LiveCheck />);
    fireEvent.change(editor(), { target: { value: '{}' } });
    expect(pressed()).toEqual([]);
  });

  it('keeps the sample when its button is pressed again', () => {
    render(<LiveCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Color' }));
    expect(pressed()).toEqual(['Color']);
    expect(editor().value).toContain('sRGB');
  });

  it('selects the text of an issue in the editor', () => {
    render(<LiveCheck />);
    settle();
    fireEvent.click(screen.getByTitle('Select in editor'));
    expect(document.activeElement).toBe(editor());
    expect(editor().selectionEnd).toBeGreaterThan(editor().selectionStart);
  });
});
