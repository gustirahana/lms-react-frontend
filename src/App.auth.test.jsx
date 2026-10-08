import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  id: 'learner-1',
  email: 'learner@example.invalid',
  displayName: 'Protected Learner',
  role: 'learner',
};

const dashboard = {
  learner,
  stats: { hoursLearned: 8, coursesInProgress: 1, certificates: 0 },
  courses: [],
};

function response(status, payload) {
  return new Response(payload === undefined ? null : JSON.stringify(payload), {
    status,
    headers: payload === undefined ? undefined : { 'Content-Type': 'application/json' },
  });
}

function routeResponse(routes) {
  return vi.fn(async (input, options = {}) => {
    const url = String(input);
    const route = routes[`${options.method || 'GET'} ${url}`];
    if (!route) throw new Error(`Unexpected request: ${options.method || 'GET'} ${url}`);
    return route();
  });
}

describe('authentication UI', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('checks the cookie session and refreshes once before showing sign-in', async () => {
    const fetchMock = routeResponse({
      'GET /api/auth/session': () => response(401, {}),
      'POST /api/auth/refresh': () => response(401, {}),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    expect(fetchMock.mock.calls.map(([url, options]) => `${options.method || 'GET'} ${url}`))
      .toEqual(['GET /api/auth/session', 'POST /api/auth/refresh']);
    expect(screen.queryByText(/Protected Learner/)).toBeNull();
  });

  it('hides learner data immediately when logout fails and warns that server invalidation is unconfirmed', async () => {
    let finishLogout;
    const fetchMock = routeResponse({
      'GET /api/auth/session': () => response(200, { user: learner }),
      'GET /api/dashboard': () => response(200, dashboard),
      'GET /api/courses': () => response(200, []),
      'POST /api/auth/logout': () => new Promise((resolve) => { finishLogout = resolve; }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    const { container } = render(<App />);

    expect(await screen.findByRole('heading', { name: /Welcome, Protected Learner/ })).toBeTruthy();
    await waitFor(() => expect(container.querySelector('.stats-grid')).toBeTruthy());
    await user.click(screen.getByRole('button', { name: 'Sign out', exact: true }));

    expect(screen.getByRole('status').textContent).toBe('Signing out…');
    expect(screen.queryByText(/Welcome, Protected Learner/)).toBeNull();
    expect(container.querySelector('.stats-grid')).toBeNull();
    finishLogout(response(503, {}));

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeTruthy();
    expect(screen.queryByText('Welcome, Protected Learner')).toBeNull();
    expect(container.querySelector('.stats-grid')).toBeNull();
    expect(screen.getByRole('alert').textContent).toMatch(/server session may still be active/);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }));
  });

  it('clears the password field after sign-in is rejected', async () => {
    const fetchMock = routeResponse({
      'GET /api/auth/session': () => response(401, {}),
      'POST /api/auth/refresh': () => response(401, {}),
      'POST /api/auth/login': () => response(401, {}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<App />);

    await screen.findByRole('heading', { name: 'Welcome back' });
    await user.type(screen.getByLabelText('Email address'), learner.email);
    const password = screen.getByLabelText('Password');
    await user.type(password, 'temporary-test-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Email or password is incorrect.');
    await waitFor(() => expect(password.value).toBe(''));
    expect(screen.getByLabelText('Email address').value).toBe(learner.email);
  });
});
