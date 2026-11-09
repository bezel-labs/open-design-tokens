// The docs and API reference are copied into the site at deploy time, next to these pages.
const BASE = import.meta.env.BASE_URL;
const REPO = 'https://github.com/bezel-labs/open-design-tokens';

export const LINKS = {
  home: BASE,
  playground: `${BASE}playground/`,
  docs: `${BASE}docs/`,
  api: `${BASE}api/`,
  gettingStarted: `${BASE}docs/getting-started/`,
  lintRules: `${BASE}docs/reference/lint-rules/`,
  issueCodes: `${BASE}docs/reference/issue-codes/`,
  cli: `${BASE}docs/reference/cli/`,
  github: REPO,
  changelog: `${REPO}/blob/main/packages/open-design-tokens/CHANGELOG.md`,
  roadmap: `${REPO}/blob/main/ROADMAP.md`,
  contributing: `${REPO}/blob/main/CONTRIBUTING.md`,
  discussions: `${REPO}/discussions`,
  npm: 'https://www.npmjs.com/package/open-design-tokens',
} as const;
