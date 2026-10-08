import { appConfig } from '../config.js';

const REQUEST_TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(message, { status = 0, cause } = {}) {
    super(message, { cause });
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function request(path, { signal, ...options } = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const forwardAbort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'X-App-Name': appConfig.name,
        'X-App-Version': appConfig.version,
        'X-App-Device': appConfig.device,
        ...options.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(`The server returned an error (${response.status}).`, {
        status: response.status,
      });
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') return null;
    let body;
    try {
      const text = await response.text();
      if (!text.trim()) return null;
      body = JSON.parse(text);
    } catch (cause) {
      throw new ApiError('The server returned an invalid JSON response.', {
        status: response.status,
        cause,
      });
    }
    return body;
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    const message = controller.signal.aborted
      ? 'The request timed out or was cancelled.'
      : 'Unable to reach the server. Check your connection and try again.';
    throw new ApiError(message, { cause });
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener('abort', forwardAbort);
  }
}

export async function getCourses({ signal } = {}) {
  const data = await request('/api/courses', { signal });
  if (!Array.isArray(data)) {
    throw new ApiError('The server returned course data in an unexpected format.');
  }

  return data.map((course) => {
    const valid = course
      && typeof course.id === 'string'
      && typeof course.title === 'string'
      && typeof course.instructor === 'string'
      && typeof course.category === 'string'
      && typeof course.level === 'string'
      && typeof course.duration === 'string'
      && Number.isInteger(course.lessons)
      && course.lessons >= 0
      && Number.isFinite(course.progress)
      && course.progress >= 0
      && course.progress <= 100
      && typeof course.accent === 'string'
      && typeof course.icon === 'string'
      && typeof course.description === 'string';
    if (!valid) {
      throw new ApiError('The server returned course data with missing or invalid fields.');
    }
    return course;
  });
}

export async function getDashboard({ signal } = {}) {
  const data = await request('/api/dashboard', { signal });
  const learner = data?.learner;
  const stats = data?.stats;
  if (!learner || typeof learner.id !== 'string' || typeof learner.displayName !== 'string') {
    throw new ApiError('The server returned dashboard data without a valid learner.');
  }
  if (!stats || !Number.isFinite(stats.hoursLearned) || stats.hoursLearned < 0
    || !Number.isFinite(stats.coursesInProgress)
    || stats.coursesInProgress < 0 || !Number.isFinite(stats.certificates) || stats.certificates < 0) {
    throw new ApiError('The server returned dashboard data in an unexpected format.');
  }
  if (!Array.isArray(data.courses)) {
    throw new ApiError('The server returned dashboard courses in an unexpected format.');
  }
  const courses = data.courses.map((course) => {
    if (!course || typeof course.id !== 'string' || typeof course.title !== 'string'
      || typeof course.instructor !== 'string' || typeof course.category !== 'string'
      || typeof course.level !== 'string' || typeof course.duration !== 'string'
      || !Number.isInteger(course.lessons) || course.lessons < 0
      || !Number.isFinite(course.progress) || course.progress < 0 || course.progress > 100
      || typeof course.accent !== 'string' || typeof course.icon !== 'string'
      || typeof course.description !== 'string') {
      throw new ApiError('The server returned dashboard course data with invalid fields.');
    }
    return course;
  });
  return { learner, stats, courses };
}
