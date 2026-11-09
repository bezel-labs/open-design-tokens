import { Field } from '@base-ui/react/field';
import { type Ref, type UIEvent, useRef } from 'react';
import { HighlightedJson } from './code-preview.js';

/**
 * Above this size the editor shows plain text. Tokenizing stays fast, but
 * updating this many spans on every keystroke would make typing lag.
 */
export const MAX_HIGHLIGHT_CHARS = 100_000;

interface Props {
  id: string;
  ref: Ref<HTMLTextAreaElement>;
  value: string;
  onChange(value: string): void;
  placeholder?: string;
}

/**
 * A transparent textarea over a colored copy of its text. The textarea still
 * handles typing, selection, and focus. Line wrapping is off so both layers
 * always break lines in the same place.
 */
export function JsonEditor({ id, ref, value, onChange, placeholder }: Props) {
  const highlightRef = useRef<HTMLPreElement>(null);

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const highlight = highlightRef.current;
    if (!highlight) return;
    highlight.scrollTop = event.currentTarget.scrollTop;
    highlight.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className="editor">
      <pre ref={highlightRef} className="editor-highlight" aria-hidden="true">
        {value.length > MAX_HIGHLIGHT_CHARS ? value : <HighlightedJson source={value} />}
        {/* Lets this layer scroll as far as the textarea when it has a scrollbar. */}
        {'\n'}
      </pre>
      <Field.Control
        id={id}
        value={value}
        onValueChange={(next) => onChange(next)}
        render={
          <textarea
            ref={ref}
            className="editor-input"
            spellCheck={false}
            wrap="off"
            placeholder={placeholder}
            onScroll={syncScroll}
          />
        }
      />
    </div>
  );
}
