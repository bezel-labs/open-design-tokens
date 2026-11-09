import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { version } from 'open-design-tokens/package.json';
import { afterEach, describe, expect, it } from 'vitest';
import { SiteHeader } from '../src/components/site-header.js';

describe('SiteHeader', () => {
  afterEach(cleanup);

  const open = (name: string) => fireEvent.click(screen.getByRole('button', { name }));
  const panelLink = (name: string) => screen.queryByRole('link', { name });

  it('links to the landing page, playground, docs, and API', () => {
    render(<SiteHeader current="landing" />);
    expect(screen.getByRole('link', { name: 'Open Design Tokens' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: 'Playground' }).getAttribute('href')).toBe(
      '/playground/',
    );
    expect(screen.getByRole('link', { name: 'Docs' }).getAttribute('href')).toBe('/docs/');
    expect(screen.getByRole('link', { name: 'API' }).getAttribute('href')).toBe('/api/');
  });

  it('lists Playground before Docs', () => {
    render(<SiteHeader current="landing" />);
    const labels = screen.getAllByRole('link').map((link) => link.textContent);
    expect(labels.indexOf('Playground')).toBeLessThan(labels.indexOf('Docs'));
  });

  it('marks only the current page', () => {
    render(<SiteHeader current="playground" />);
    const current = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page');
    expect(current.map((link) => link.textContent)).toEqual(['Playground']);
  });

  it('shows the published package version', () => {
    render(<SiteHeader current="landing" />);
    expect(screen.getByRole('link', { name: `v${version}` })).toBeTruthy();
  });

  it('opens the resources menu from its trigger, and toggles it closed', () => {
    render(<SiteHeader current="landing" />);
    expect(panelLink('Roadmap')).toBeNull();
    open('Resources');
    expect(panelLink('Roadmap')).toBeTruthy();
    open('Resources');
    expect(panelLink('Roadmap')).toBeNull();
  });

  it('closes on Escape and gives focus back to the trigger', () => {
    render(<SiteHeader current="landing" />);
    open('Resources');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(panelLink('Roadmap')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Resources' }));
  });

  it('closes on a press outside, but not on one inside', () => {
    render(<SiteHeader current="landing" />);
    open('Resources');
    fireEvent.pointerDown(panelLink('Roadmap') as HTMLElement);
    expect(panelLink('Roadmap')).toBeTruthy();
    fireEvent.pointerDown(document.body);
    expect(panelLink('Roadmap')).toBeNull();
  });

  it('closes when focus moves elsewhere', () => {
    render(<SiteHeader current="landing" />);
    open('Resources');
    fireEvent.focusIn(screen.getByRole('link', { name: 'Docs' }));
    expect(panelLink('Roadmap')).toBeNull();
  });

  it('puts every link in the phone menu', () => {
    render(<SiteHeader current="landing" />);
    open('Menu');
    const links = screen.getAllByRole('link').map((link) => link.textContent);
    // Also in the bar, which CSS hides on phones.
    for (const name of ['Docs', 'Playground', 'API', 'GitHub']) {
      expect(links.filter((label) => label === name)).toHaveLength(2);
    }
    expect(links).toContain('Roadmap');
  });
});
