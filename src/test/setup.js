import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  const values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key),
    clear: () => values.clear(),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();

});
