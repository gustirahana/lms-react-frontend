import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { demoAccount } from './demo.js';

vi.mock('./realtime.js', () => ({ openRealtimeChannels: vi.fn() }));

describe('public landing and demo entry', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
  });

  it('renders the public page without waiting on or contacting the API', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /A little curiosity/ })).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /Creator: JakIja/ })).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Open learner demo' }).getAttribute('href')).toBe('#signin-demo');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('opens demo sign-in with only the shared learner credentials and returns home', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('link', { name: 'Open learner demo' }));
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.getByLabelText('Email address').value).toBe(demoAccount.email);
    expect(screen.getByLabelText('Password').value).toBe(demoAccount.password);
    await user.click(screen.getByRole('link', { name: /Back to JakIja Learn/ }));
    expect(await screen.findByRole('heading', { name: /A little curiosity/ })).toBeTruthy();
  });
  it('filters by category and search, then resets an empty result', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Design', exact: true }));
    expect(screen.getByRole('status').textContent).toBe('1 course to explore');
    expect(screen.queryByRole('button', { name: 'Preview Build your first React workspace' })).toBeNull();
    await user.type(screen.getByRole('searchbox', { name: 'Search sample courses' }), 'no matching subject');
    await user.click(screen.getByRole('button', { name: 'Find courses' }));
    expect(screen.getByRole('heading', { name: 'No courses match that search.' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Show all courses' }));
    expect(screen.getByRole('status').textContent).toBe('3 courses to explore');
  });

  it('traps focus in the public course preview and restores the opener on Escape', async () => {
    const user = userEvent.setup();
    render(<App />);
    const opener = screen.getByRole('button', { name: 'Preview Interfaces that make sense' });
    await user.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Interfaces that make sense' });
    const close = screen.getByRole('button', { name: 'Close course preview' });
    expect(document.activeElement).toBe(close);
    expect(document.querySelector('.landing > div').hasAttribute('inert')).toBe(true);
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Open in learner demo' }));
    await user.tab();
    expect(document.activeElement).toBe(close);
    expect(dialog.textContent).toContain('Full teaching materials are not included');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
    expect(document.body.style.overflow).toBe('');
  });

});
