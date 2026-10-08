import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';

vi.mock('./realtime.js', () => ({
  openRealtimeChannels: vi.fn(() => ({
    close: vi.fn(),
    setCourse: vi.fn(),
    onClassroomMessage: vi.fn(() => () => {}),
    sendClassroomMessage: vi.fn(),
    markNotificationRead: vi.fn(),
  })),
}));

const learner = {
  id: 'a11y-learner',
  email: 'learner@example.invalid',
  displayName: 'Local Accessibility Check',
  role: 'learner',
};

const course = {
  id: 'a11y-course',
  title: 'Accessible Web Foundations',
  instructor: 'Local Demo Instructor',
  category: 'Web Development',
  level: 'Beginner',
  duration: '4 hours',
  lessons: 8,
  progress: 25,
  accent: 'lavender',
  icon: 'A',
  description: 'Temporary local test content.',
};

function response(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function routeResponse() {
  return vi.fn(async (input) => {
    switch (String(input)) {
      case '/api/auth/session': return response({ user: learner });
      case '/api/dashboard': return response({
        learner,
        stats: { hoursLearned: 2, coursesInProgress: 1, certificates: 0 },
        courses: [course],
      });
      case '/api/courses': return response([course]);
      default: throw new Error(`Unexpected request: ${String(input)}`);
    }
  });
}

describe('keyboard and overlay accessibility', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', routeResponse());
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })));
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{ width: 1, height: 1 }]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps a visible toast out of the modal accessibility tree and traps/restores focus', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /Welcome, Local Accessibility Check/ });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Open Accessible Web Foundations' })).toBeTruthy());
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    const toast = document.querySelector('.toast');
    expect(toast?.textContent).toContain('caught up');

    const opener = screen.getByRole('button', { name: 'Open Accessible Web Foundations' });
    await user.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Accessible Web Foundations' });
    expect(document.querySelector('.main-area').hasAttribute('inert')).toBe(true);
    expect(document.querySelector('.sidebar').hasAttribute('inert')).toBe(true);
    expect(document.querySelector('.skip-link').hasAttribute('inert')).toBe(true);
    expect(toast.hasAttribute('inert')).toBe(true);
    expect(toast.getAttribute('aria-hidden')).toBe('true');
    expect(screen.queryByRole('button', { name: 'Dismiss notification' })).toBeNull();
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close course details');

    for (let index = 0; index < 6; index += 1) await user.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('opens the mobile drawer as a modal, wraps keyboard focus, and restores the trigger', async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: /Welcome, Local Accessibility Check/ });
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await user.click(trigger);

    const drawer = screen.getByRole('dialog', { name: 'Learner navigation' });
    expect(drawer.getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('.main-area').hasAttribute('inert')).toBe(true);
    expect(document.querySelector('.skip-link').hasAttribute('inert')).toBe(true);
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close menu');

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(drawer.contains(document.activeElement)).toBe(true);
    await user.keyboard('{Tab}');
    expect(document.activeElement.getAttribute('aria-label')).toBe('Close menu');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Learner navigation' })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
