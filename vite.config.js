import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function containsControlCharacters(value) {
  return [...value].some((character) => {
    const code = character.codePointAt(0);
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
  });
}

export function validateProductionOrigins(env) {
  const apiOrigin = env.VITE_API_URL?.trim();
  const socketOrigin = env.VITE_SOCKET_URL?.trim() || apiOrigin;
  for (const [name, origin] of [['VITE_API_URL', apiOrigin], ['VITE_SOCKET_URL', socketOrigin]]) {
    if (!origin) continue;
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`${name} must be an absolute HTTPS origin in production.`);
    }
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password
      || !['', '/'].includes(parsed.pathname) || parsed.search || parsed.hash) {
      throw new Error(`${name} must be an origin without a path, credentials, query, or fragment.`);
    }
    if (parsed.protocol !== 'https:') {
      throw new Error(`${name} must use HTTPS in production.`);
    }
  }
}

export function validatePublicMetadata(env) {
  for (const [name, fallback, maxLength] of [
    ['VITE_APP_NAME', 'JakIja Learn', 128],
    ['VITE_APP_VERSION', '0.1.0', 64],
  ]) {
    const value = env[name]?.trim() || fallback;
    if (value.length > maxLength || containsControlCharacters(value)) {
      throw new Error(`${name} must be at most ${maxLength} characters and contain no control characters.`);
    }
  }

  const device = (env.VITE_APP_DEVICE?.trim() || 'web').toLowerCase();
  if (!['web', 'mobile'].includes(device)) {
    throw new Error('VITE_APP_DEVICE must be either "web" or "mobile".');
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  validatePublicMetadata(env);
  if (command === 'build') validateProductionOrigins(env);

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
        },
        '/socket.io': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          ws: true,
        },
      },
    },
  };
});
