const allowedDevices = new Set(['web', 'mobile']);

function requiredValue(name, rawValue, fallback) {
  const value = rawValue?.trim() || fallback;
  if (!value) {
    throw new Error(`Missing required frontend environment value: ${name}`);
  }
  return value;
}

function containsControlCharacters(value) {
  return [...value].some((character) => {
    const code = character.codePointAt(0);
    return code <= 0x1f || (code >= 0x7f && code <= 0x9f);
  });
}

function publicMetadata(name, rawValue, fallback, maxLength) {
  const value = requiredValue(name, rawValue, fallback);
  if (value.length > maxLength || containsControlCharacters(value)) {
    throw new Error(`${name} must be at most ${maxLength} characters and contain no control characters.`);
  }
  return value;
}

const device = requiredValue('VITE_APP_DEVICE', import.meta.env.VITE_APP_DEVICE, 'web').toLowerCase();
if (!allowedDevices.has(device)) {
  throw new Error('VITE_APP_DEVICE must be either "web" or "mobile".');
}

function serviceOrigin(name, value) {
  if (!value) return '';
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) origin or empty.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password
    || !['', '/'].includes(parsed.pathname) || parsed.search || parsed.hash) {
    throw new Error(`${name} must be an origin without a path, credentials, query, or fragment.`);
  }
  if (import.meta.env.PROD && parsed.protocol !== 'https:') {
    throw new Error(`${name} must use HTTPS in production.`);
  }
  return parsed.origin;
}

const apiUrl = serviceOrigin('VITE_API_URL', import.meta.env.VITE_API_URL?.trim() || '');
const socketUrl = serviceOrigin('VITE_SOCKET_URL', import.meta.env.VITE_SOCKET_URL?.trim() || apiUrl);
const pageHost = globalThis.location?.hostname?.toLowerCase();
const localPage = ['localhost', '127.0.0.1', '[::1]'].includes(pageHost);
if (import.meta.env.PROD && globalThis.location && globalThis.location.protocol !== 'https:' && !localPage) {
  throw new Error('The production frontend must be served over HTTPS.');
}

export const appConfig = Object.freeze({
  name: publicMetadata('VITE_APP_NAME', import.meta.env.VITE_APP_NAME, 'JakIja Learn', 128),
  version: publicMetadata('VITE_APP_VERSION', import.meta.env.VITE_APP_VERSION, '0.1.0', 64),
  device,
  apiBaseUrl: apiUrl.replace(/\/$/, ''),
  socketOrigin: socketUrl || globalThis.location?.origin || '',
});
