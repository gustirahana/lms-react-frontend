import { describe, expect, it } from 'vitest';
import { validateProductionOrigins, validatePublicMetadata } from '../vite.config.js';

describe('public app metadata', () => {
  it('accepts defaults and the supported mobile device label', () => {
    expect(() => validatePublicMetadata({})).not.toThrow();
    expect(() => validatePublicMetadata({
      VITE_APP_NAME: 'JakIja Learn Mobile',
      VITE_APP_VERSION: '1.2.3',
      VITE_APP_DEVICE: 'MOBILE',
    })).not.toThrow();
  });

  it.each([
    ['VITE_APP_NAME', 'x'.repeat(129)],
    ['VITE_APP_VERSION', 'x'.repeat(65)],
    ['VITE_APP_NAME', 'JakIja\nAdmin'],
    ['VITE_APP_VERSION', '0.1.0\u007f'],
  ])('rejects invalid public metadata in %s', (name, value) => {
    expect(() => validatePublicMetadata({ [name]: value }))
      .toThrow(`${name} must be at most`);
  });

  it('rejects unsupported device labels', () => {
    expect(() => validatePublicMetadata({ VITE_APP_DEVICE: 'tablet' }))
      .toThrow('VITE_APP_DEVICE must be either "web" or "mobile".');
  });
});

describe('production API and socket origins', () => {
  it('allows empty origins for same-origin deployments and localhost preview', () => {
    expect(() => validateProductionOrigins({})).not.toThrow();
    expect(() => validateProductionOrigins({ VITE_API_URL: '', VITE_SOCKET_URL: '' })).not.toThrow();
  });

  it('accepts explicit HTTPS origins', () => {
    expect(() => validateProductionOrigins({
      VITE_API_URL: 'https://api.example.test',
      VITE_SOCKET_URL: 'https://realtime.example.test',
    })).not.toThrow();
  });

  it.each([
    ['VITE_API_URL', 'http://localhost:4000'],
    ['VITE_API_URL', 'http://127.0.0.1:4000'],
    ['VITE_SOCKET_URL', 'http://localhost:4000'],
  ])('rejects an explicitly configured HTTP %s origin, including localhost', (name, origin) => {
    expect(() => validateProductionOrigins({ [name]: origin }))
      .toThrow(`${name} must use HTTPS in production.`);
  });

  it('rejects service URLs that contain a path instead of an origin', () => {
    expect(() => validateProductionOrigins({ VITE_API_URL: 'https://api.example.test/v1' }))
      .toThrow('VITE_API_URL must be an origin without a path, credentials, query, or fragment.');
  });
});
