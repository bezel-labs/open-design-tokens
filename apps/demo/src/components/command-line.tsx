import { Button } from '@base-ui/react/button';
import { useEffect, useState } from 'react';

const COPIED_MS = 1500;

interface Props {
  command: string;
}

/** A command to run, with a button to copy it. */
export function CommandLine({ command }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const handle = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(handle);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      // The browser refused. The command is still on screen to select by hand.
    }
  };

  return (
    <div className="command-line">
      <code className="command-text">
        <span aria-hidden="true">$ </span>
        {command}
      </code>
      <Button className="command-copy" onClick={copy}>
        <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
      </Button>
    </div>
  );
}
