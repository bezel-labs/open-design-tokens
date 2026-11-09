import { Field } from '@base-ui/react/field';
import { Toggle } from '@base-ui/react/toggle';
import { ToggleGroup } from '@base-ui/react/toggle-group';
import { useRef, useState } from 'react';
import { LIVE_SAMPLES } from '../lib/live-samples.js';
import { selectInEditor } from '../lib/select-in-editor.js';
import { useTokenCheck } from '../lib/use-token-check.js';
import { IssueList } from './issue-list.js';
import { JsonEditor } from './json-editor.js';
import { ScrollPanel } from './scroll-panel.js';

const PASTE = 'Paste yours';

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`;

/** A small working copy of the playground: real checks on samples or a pasted file. */
export function LiveCheck() {
  const [first] = LIVE_SAMPLES;
  const [source, setSource] = useState(first?.source ?? '');
  const [selected, setSelected] = useState(first?.label ?? PASTE);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const { result, tooLarge, positions, rows, errors, warnings, valid } = useTokenCheck(
    source,
    true,
  );
  const empty = source.trim() === '';

  const choose = (label: string) => {
    setSelected(label);
    if (label === PASTE) {
      setSource('');
      editorRef.current?.focus();
      return;
    }
    const sample = LIVE_SAMPLES.find((candidate) => candidate.label === label);
    if (sample) setSource(sample.source);
  };

  const edit = (next: string) => {
    setSource(next);
    // Once edited it is no longer that sample. Pasted files stay under Paste yours.
    setSelected((current) => (current === PASTE ? PASTE : ''));
  };

  const select = (offset: number, length: number) => {
    if (editorRef.current) selectInEditor(editorRef.current, offset, length);
  };

  return (
    <div className="live-check">
      <ToggleGroup
        className="live-samples"
        aria-label="Example token files"
        value={selected ? [selected] : []}
        onValueChange={([label]) => {
          // Pressing the current choice again reports no value, and changes nothing.
          if (label) choose(label);
        }}
      >
        {LIVE_SAMPLES.map(({ label }) => (
          <Toggle key={label} className="live-sample" value={label}>
            {label}
          </Toggle>
        ))}
        <Toggle className="live-sample live-sample-paste" value={PASTE}>
          {PASTE}
        </Toggle>
      </ToggleGroup>
      <Field.Root className="editor-field">
        <Field.Label className="pane-title">tokens.json</Field.Label>
        <JsonEditor
          id="live-editor"
          ref={editorRef}
          value={source}
          onChange={edit}
          placeholder="Paste a design token file here"
        />
      </Field.Root>
      <div className="live-results">
        {tooLarge ? (
          <p className="status status-error">Input is larger than 2 MB and was not checked.</p>
        ) : empty ? (
          <p className="live-empty">Results appear here as soon as you paste or type.</p>
        ) : result ? (
          <>
            <p className={`status ${valid ? 'status-ok' : 'status-error'}`} role="status">
              <span className="verdict">{valid ? 'Valid' : 'Invalid'}</span> ·{' '}
              <span className={errors > 0 ? 'stat-error' : 'stat-clear'}>
                {count(errors, 'error')}
              </span>{' '}
              ·{' '}
              <span className={warnings > 0 ? 'stat-warning' : 'stat-clear'}>
                {count(warnings, 'warning')}
              </span>
            </p>
            <ScrollPanel>
              <IssueList rows={rows} positions={positions} onSelect={select} />
            </ScrollPanel>
          </>
        ) : null}
      </div>
    </div>
  );
}
