// Public credentials for the shared learner showcase, never a privileged account.
export const demoAccount = Object.freeze({ email: 'learner.demo@jakija.example', password: 'JakIja-Learn-Demo-2026!' });

export const sampleCourses = [
  { id: '7b810001-0000-4000-8000-000000000001', title: 'Interfaces that make sense', category: 'Design', level: 'beginner', duration: '3 hours', lessons: 12, accent: 'lavender', icon: 'Aa', description: 'A sample learning path through hierarchy, typography, and accessible interface patterns.', progress: 42, instructor: 'JakIja Demo Studio' },
  { id: '7b810001-0000-4000-8000-000000000002', title: 'Build your first React workspace', category: 'Development', level: 'intermediate', duration: '5 hours', lessons: 18, accent: 'peach', icon: '</>', description: 'A sample course on components, application state, and connecting a learner interface to an API.', progress: 18, instructor: 'JakIja Demo Studio' },
  { id: '7b810001-0000-4000-8000-000000000003', title: 'A thoughtful start with APIs', category: 'Backend', level: 'beginner', duration: '2 hours', lessons: 8, accent: 'mint', icon: '{ }', description: 'A sample course exploring API contracts, cookie sessions, and access boundaries with NestJS.', progress: 0, instructor: 'JakIja Demo Studio' },
];
