import catalog from './data/demo-courses.json';

// Public credentials for the shared learner showcase, never a privileged account.
export const demoAccount = Object.freeze({ email: 'learner.demo@jakija.example', password: 'JakIja-Learn-Demo-2026!' });
export const sampleCourses = catalog.map((course) => ({
  ...course,
  duration: course.durationMinutes >= 60 ? `${course.durationMinutes / 60} hours` : `${course.durationMinutes} min`,
  instructor: 'JakIja Demo Studio',
}));
