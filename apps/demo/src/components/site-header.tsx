import { Collapsible } from '@base-ui/react/collapsible';
import { Separator } from '@base-ui/react/separator';
import { version } from 'open-design-tokens/package.json';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { LINKS } from '../lib/links.js';

const RESOURCES = [
  { label: 'Getting started', href: LINKS.gettingStarted },
  { label: 'Lint rules', href: LINKS.lintRules },
  { label: 'Issue codes', href: LINKS.issueCodes },
  { label: 'CLI reference', href: LINKS.cli },
  { label: 'Changelog', href: LINKS.changelog },
  { label: 'Roadmap', href: LINKS.roadmap },
  { label: 'Discussions', href: LINKS.discussions },
  { label: 'Contributing', href: LINKS.contributing },
  { label: 'npm package', href: LINKS.npm },
];

interface HeaderMenuProps {
  label: string;
  children: ReactNode;
}

/**
 * A disclosure dropdown. Collapsible is used over NavigationMenu, which adds
 * about 39 KB gzipped to every page, so closing on Escape and outside is here.
 */
function HeaderMenu({ label, children }: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const isOutside = (target: EventTarget | null) =>
      target instanceof Node && !rootRef.current?.contains(target);
    const onPointerDown = (event: PointerEvent) => {
      if (isOutside(event.target)) setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (isOutside(event.target)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <Collapsible.Root ref={rootRef} className="menu" open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger ref={triggerRef} className="nav-link menu-trigger">
        {label} <span aria-hidden="true">▾</span>
      </Collapsible.Trigger>
      <Collapsible.Panel className="menu-panel">
        <ul className="menu-list">{children}</ul>
      </Collapsible.Panel>
    </Collapsible.Root>
  );
}

interface SiteHeaderProps {
  current: 'landing' | 'playground';
}

/** The menu bar shared by every page. */
export function SiteHeader({ current }: SiteHeaderProps) {
  const primary = [
    {
      label: 'Playground',
      href: LINKS.playground,
      ...(current === 'playground' ? { 'aria-current': 'page' as const } : {}),
    },
    { label: 'Docs', href: LINKS.docs },
    { label: 'API', href: LINKS.api },
  ];

  return (
    <header className="site-header">
      <div className="site-header-bar">
        <a
          className="site-logo"
          href={LINKS.home}
          {...(current === 'landing' ? { 'aria-current': 'page' as const } : {})}
        >
          Open Design Tokens
        </a>
        <nav className="site-nav-area" aria-label="Main">
          <ul className="site-nav">
            {primary.map(({ label, ...link }) => (
              <li key={label} className="nav-wide">
                <a className="nav-link" {...link}>
                  {label}
                </a>
              </li>
            ))}
            <li className="nav-wide">
              <HeaderMenu label="Resources">
                {RESOURCES.map(({ label, href }) => (
                  <li key={label}>
                    <a className="menu-link" href={href}>
                      {label}
                    </a>
                  </li>
                ))}
              </HeaderMenu>
            </li>
            <li className="nav-extra-wide">
              <a className="nav-link nav-version" href={LINKS.changelog} title="Changelog">
                v{version}
              </a>
            </li>
            <li className="nav-wide">
              <a className="nav-link" href={LINKS.github}>
                GitHub
              </a>
            </li>
            <li className="nav-narrow">
              <HeaderMenu label="Menu">
                {[...primary, ...RESOURCES, { label: 'GitHub', href: LINKS.github }].map(
                  ({ label, ...link }) => (
                    <li key={label}>
                      <a className="menu-link" {...link}>
                        {label}
                      </a>
                    </li>
                  ),
                )}
              </HeaderMenu>
            </li>
          </ul>
        </nav>
      </div>
      <Separator className="stripes" />
    </header>
  );
}
