import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.jsx';
import { localizeCourse } from './i18n.jsx';
import { sampleCourses } from './demo.js';

beforeEach(() => { window.history.replaceState({}, '', '/'); });

describe('site locale and course language availability', () => {
  it('switches and persists Indonesian UI while English-only course titles remain English', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Interface language' }), 'id');
    expect(document.documentElement.lang).toBe('id');
    expect(screen.getByRole('link', { name: 'Masuk' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Antarmuka yang Mudah Dipahami', exact: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Build your first React workspace', exact: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mengenal API dengan NestJS', exact: true })).toBeTruthy();
    expect(window.localStorage.getItem('jakija.locale')).toBe('id');
    unmount();
    render(<App />);
    expect(screen.getByRole('combobox', { name: 'Bahasa antarmuka' }).value).toBe('id');
  });

  it('keeps Indonesian-only, English-only, and bilingual filters mutually exclusive', async () => {
    const user = userEvent.setup();
    render(<App />);
    const filter = screen.getByRole('combobox', { name: 'Course language' });
    expect(screen.getByRole('status').textContent).toBe('9 courses to explore');
    for (const value of ['id', 'en', 'both']) {
      await user.selectOptions(filter, value);
      expect(screen.getByRole('status').textContent).toBe('3 courses to explore');
      expect(document.querySelectorAll('.lp-course')).toHaveLength(3);
    }
    expect(screen.queryByRole('button', { name: 'Build your first React workspace', exact: true })).toBeNull();
    expect(screen.getByRole('button', { name: 'Interfaces that make sense', exact: true })).toBeTruthy();
  });

  it('does not synthesize unsupported course translations', () => {
    const englishOnly = sampleCourses.find(course => course.languages.length === 1 && course.languages[0] === 'en');
    const indonesianOnly = sampleCourses.find(course => course.languages.length === 1 && course.languages[0] === 'id');
    expect(localizeCourse(englishOnly, 'id').title).toBe(englishOnly.title);
    expect(localizeCourse(indonesianOnly, 'en').title).toBe(indonesianOnly.title);
  });

  it('continues switching language when browser storage is unavailable', async () => {
    const user = userEvent.setup();
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
    render(<App />);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Interface language' }), 'id');
    expect(document.documentElement.lang).toBe('id');
    vi.restoreAllMocks();
  });
});
