import { ApiError, request } from './client.js';

function readUser(payload) {
  const user = payload?.user;
  if (!user || typeof user.id !== 'string' || typeof user.email !== 'string') {
    throw new ApiError('The server returned an invalid session.');
  }
  return user;
}

export async function getSession(options) {
  return readUser(await request('/api/auth/session', options));
}

export async function login(email, password, options) {
  await request('/api/auth/login', {
    ...options,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return getSession(options);
}

export async function refreshSession(options) {
  await request('/api/auth/refresh', {
    ...options,
    method: 'POST',
  });
  return getSession(options);
}

export async function logout(options) {
  await request('/api/auth/logout', {
    ...options,
    method: 'POST',
  });
}

export function isUnauthorized(error) {
  return error instanceof ApiError && error.status === 401;
}
