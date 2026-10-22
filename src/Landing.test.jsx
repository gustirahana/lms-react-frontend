import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { demoAccount } from './demo.js';

vi.mock('./realtime.js', () => ({ openRealtimeChannels: vi.fn() }));

describe('public landing and demo entry', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 401 })));
  });

  it('renders the public page without waiting on or contacting the API', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /Make room for/ })).toBeTruthy();
    expect(screen.getAllByText('Creator: JakIja')).toHaveLength(2);
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
    expect(await screen.findByRole('heading', { name: /Make room for/ })).toBeTruthy();
  });
});
