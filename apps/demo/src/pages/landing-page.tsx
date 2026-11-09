import { CommandLine } from '../components/command-line.js';
import { LiveCheck } from '../components/live-check.js';
import { SiteHeader } from '../components/site-header.js';
import { LINKS } from '../lib/links.js';
import { LOGO_ART } from '../lib/logo-art.js';

const HIGHLIGHTS = [
  {
    title: 'Designers and developers',
    body: 'Confirm a file is sound before it ships, from the terminal or right in the browser.',
  },
  {
    title: 'AI agents',
    body: 'Errors carry stable codes and exact paths, so agents can keep their edits within your standards.',
  },
  {
    title: 'Safe on untrusted files',
    body: 'Invalid input of any shape comes back as diagnostics, and a document never makes it throw.',
  },
  {
    title: 'Typed and portable',
    body: 'ESM and CommonJS with types included. Runs in Node 20.19+, evergreen browsers, and modern bundlers.',
  },
];

const STATS = [
  { value: '~20 ms', label: 'to validate 10,000 tokens' },
  { value: '~13 kB', label: 'validator, gzipped' },
  { value: '12', label: 'configurable lint rules' },
  { value: '0', label: 'runtime dependencies' },
];

const LINT_CONFIG = `{
  "extends": ["recommended"],
  "rules": {
    "token-name-length": ["error", { "min": 2, "max": 40 }],
    "naming-convention": ["error", { "tokens": "kebab" }]
  }
}`;

export function LandingPage() {
  return (
    <>
      <SiteHeader current="landing" />
      <main className="landing">
        <div className="masthead">
          <div className="hero-logo" aria-hidden="true">
            {LOGO_ART}
          </div>
        </div>

        <section className="hero">
          <div className="hero-text">
            <h1 className="hero-title">Check a design token file with one command</h1>
            <p className="hero-copy">
              A free, open-source TypeScript toolkit for validating and linting DTCG design tokens.
            </p>
            <div className="actions">
              <a className="button button-primary" href={LINKS.gettingStarted}>
                Get started
              </a>
              <a className="button" href={LINKS.playground}>
                Try the playground
              </a>
            </div>
            <CommandLine command="npx open-design-tokens tokens.json" />
            <dl className="stats">
              {STATS.map(({ value, label }) => (
                <div key={label} className="stat">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="pane hero-media">
            <LiveCheck />
          </div>
        </section>

        <section>
          <div className="section-heading">
            <h2>Two questions, one toolkit</h2>
            <p>The specification defines a valid file. Your team decides what a good one is.</p>
          </div>
          <div className="feature-grid">
            <article className="pane feature">
              <h3 className="pane-title">The validator</h3>
              <p>
                <strong>Is this valid DTCG?</strong> Works on any 2025.10 file with no
                configuration, and reports only what the specification says.
              </p>
              <pre className="code-block">
                <span className="path">color.brand.primary.$value.colorSpace</span>{' '}
                <span className="stat-error">error</span>
                {'\n  Unsupported color space "sRGB". Did you mean "srgb"?\n  '}
                <span className="code">color.color-space.invalid</span>
                {'\n\n'}
                <span className="path">spacing.small.$value</span>{' '}
                <span className="stat-error">error</span>
                {'\n  A dimension value must have a "unit" property.\n  '}
                <span className="code">dimension.unit.missing</span>
              </pre>
            </article>
            <article className="pane feature">
              <h3 className="pane-title">The linter</h3>
              <p>
                <strong>Does this meet our standards?</strong> Goes beyond the specification with
                rules you choose in a <code className="inline-code">dtcg-lint.config.json</code>.
              </p>
              <pre className="code-block">{LINT_CONFIG}</pre>
            </article>
          </div>
        </section>

        <section className="feature-grid" aria-label="Highlights">
          {HIGHLIGHTS.map(({ title, body }) => (
            <article key={title} className="pane feature">
              <h2 className="pane-title">{title}</h2>
              <p>{body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
