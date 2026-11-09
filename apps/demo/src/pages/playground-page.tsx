import { Field } from '@base-ui/react/field';
import { Tabs } from '@base-ui/react/tabs';
import { type ReactNode, useCallback, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ExamplesPane } from '../components/examples-pane.js';
import { IssueList } from '../components/issue-list.js';
import { JsonEditor } from '../components/json-editor.js';
import { ScrollPanel } from '../components/scroll-panel.js';
import { SiteHeader } from '../components/site-header.js';
import { Toolbar } from '../components/toolbar.js';
import { FULL_PROJECT_JSON } from '../examples.js';
import { selectInEditor } from '../lib/select-in-editor.js';
import { useTokenCheck } from '../lib/use-token-check.js';

type PanelName = 'examples' | 'editor' | 'results';

interface WorkspacePanelProps {
  name: PanelName;
  active: boolean;
  children: ReactNode;
}

/**
 * One tab on narrow screens, one always-visible region on wide ones. Base UI
 * hides inactive panels with `hidden` and `inert`, so those are switched off
 * here and styles.css hides inactive panels at narrow widths only.
 */
function WorkspacePanel({ name, active, children }: WorkspacePanelProps) {
  return (
    <Tabs.Panel
      value={name}
      keepMounted
      hidden={false}
      inert={false}
      tabIndex={-1}
      className={`tab-panel tab-panel-${name}${active ? ' tab-panel-active' : ''}`}
    >
      {children}
    </Tabs.Panel>
  );
}

export function PlaygroundPage() {
  const [source, setSource] = useState(FULL_PROJECT_JSON);
  const [lintEnabled, setLintEnabled] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelName>('editor');
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const { result, lintResult, tooLarge, positions, rows, errors, warnings, valid } = useTokenCheck(
    source,
    lintEnabled,
  );

  const select = (offset: number, length: number) => {
    const el = editorRef.current;
    if (!el) return;
    // On narrow screens the editor may be on another tab, and can't take focus until shown.
    flushSync(() => setActivePanel('editor'));
    selectInEditor(el, offset, length);
  };

  const loadExample = useCallback((json: string) => {
    setSource(json);
    setActivePanel('editor');
  }, []);

  const format = () => {
    try {
      setSource(`${JSON.stringify(JSON.parse(source), null, 2)}\n`);
    } catch {
      // Leave invalid JSON untouched; the result pane already shows the parse error.
    }
  };

  return (
    <>
      <SiteHeader current="playground" />
      <main className="app">
        <h1 className="visually-hidden">Playground</h1>
        <Tabs.Root
          className="layout"
          value={activePanel}
          onValueChange={(value) => setActivePanel(value as PanelName)}
        >
          <Tabs.List className="tabs" aria-label="Playground panels">
            <Tabs.Tab className="tab" value="examples">
              Examples
            </Tabs.Tab>
            <Tabs.Tab className="tab" value="editor">
              Editor
            </Tabs.Tab>
            <Tabs.Tab className="tab" value="results">
              Results{' '}
              <span className={valid ? 'stat-clear' : 'stat-error'}>{valid ? 'OK' : errors}</span>
            </Tabs.Tab>
          </Tabs.List>
          <WorkspacePanel name="examples" active={activePanel === 'examples'}>
            <ExamplesPane onLoad={loadExample} />
          </WorkspacePanel>
          <WorkspacePanel name="editor" active={activePanel === 'editor'}>
            <div className="pane">
              <Toolbar
                onLoad={setSource}
                onFormat={format}
                onClear={() => setSource('')}
                lintEnabled={lintEnabled}
                onToggleLint={setLintEnabled}
              />
              {/* The toolbar stays outside: its checkbox would register as this field's control. */}
              <Field.Root className="editor-field">
                <Field.Label className="pane-title">tokens.json</Field.Label>
                <JsonEditor id="editor" ref={editorRef} value={source} onChange={setSource} />
              </Field.Root>
            </div>
          </WorkspacePanel>
          <WorkspacePanel name="results" active={activePanel === 'results'}>
            <div className="pane">
              <h2 className="pane-title">
                {lintEnabled ? 'Validation and lint results' : 'Validation results'}
              </h2>
              {tooLarge ? (
                <p className="status status-error">
                  Input is larger than 2 MB and was not validated.
                </p>
              ) : result ? (
                <>
                  <p className={`status ${valid ? 'status-ok' : 'status-error'}`} role="status">
                    <span className="verdict">{valid ? 'Valid' : 'Invalid'}</span> ·{' '}
                    <span className={errors > 0 ? 'stat-error' : 'stat-clear'}>
                      {errors} errors
                    </span>{' '}
                    ·{' '}
                    <span className={warnings > 0 ? 'stat-warning' : 'stat-clear'}>
                      {warnings} warnings
                    </span>{' '}
                    · <span className="stat-spec">spec {result.spec}</span> ·{' '}
                    <span className="stat-count">
                      {result.stats.tokens} tokens, {result.stats.groups} groups,{' '}
                      {result.stats.aliases} aliases
                    </span>
                    {lintResult && lintResult.skipped.length > 0
                      ? ` · ${lintResult.skipped.length} rule checks skipped on invalid nodes`
                      : ''}
                  </p>
                  <ScrollPanel>
                    <IssueList rows={rows} positions={positions} onSelect={select} />
                  </ScrollPanel>
                </>
              ) : null}
            </div>
          </WorkspacePanel>
        </Tabs.Root>
      </main>
    </>
  );
}
