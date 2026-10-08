import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../config.js', () => ({
  appConfig: {
    name: 'JakIja Test',
    version: '0.8.1-test',
    device: 'mobile',
    apiBaseUrl: '',
    socketOrigin: '',
  },
}));

import { request } from './client.js';

describe('public app metadata headers', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends public metadata separately from cookie credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await request('/api/example', { method: 'POST' });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [, options] = fetchMock.mock.calls[0];
    expect(options.credentials).toBe('include');
    expect(options.headers).toMatchObject({
      'X-App-Name': 'JakIja Test',
      'X-App-Version': '0.8.1-test',
      'X-App-Device': 'mobile',
    });
    expect(options.headers.Authorization).toBeUndefined();
  });
});
