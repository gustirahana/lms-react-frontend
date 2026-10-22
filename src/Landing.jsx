import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, Clock3, GraduationCap, LayoutDashboard, Menu, MessageCircle, Search, X } from 'lucide-react';
import { demoAccount, sampleCourses } from './demo.js';
import './landing.css';

const artwork = {
  Design: '/images/course-design-notes.webp',
  Development: '/images/course-react-readable.webp',
  Backend: '/images/course-backend.webp',
};
const categories = ['All courses', ...new Set(sampleCourses.map((course) => course.category))];

function PublicCoursePreview({ course, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleKeys = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const controls = [...dialogRef.current.querySelectorAll('button, a[href]')];
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeys);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeys);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [onClose]);
  return (
    <div className="public-preview-backdrop" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="public-course-preview" role="dialog" aria-modal="true" aria-labelledby="public-course-title" ref={dialogRef}>
        <button ref={closeRef} className="public-preview-close" onClick={onClose} aria-label="Close course preview"><X size={21} /></button>
        <img src={artwork[course.category]} alt="" width="768" height="512" />
        <div className="public-preview-copy"><p className="lp-eyebrow">{course.category} / {course.level}</p><h2 id="public-course-title">{course.title}</h2><p>{course.description}</p>
          <div className="lp-course-meta"><span><Clock3 size={15} />{course.duration}</span><span><BookOpen size={15} />{course.lessons} sample lessons</span></div>
          <p className="lp-sample-note">This fictional course demonstrates enrollment, progress, and classroom features. Full teaching materials are not included.</p>
          <a href="#signin-demo" className="lp-button lp-button-primary">Open in learner demo <ArrowRight size={17} /></a>
        </div>
      </section>
    </div>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All courses');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const menuRef = useRef(null);
  const catalogRef = useRef(null);
  const resultsHeadingRef = useRef(null);
  const visibleCourses = useMemo(() => sampleCourses.filter((course) => (
    (category === 'All courses' || category === course.category)
    && `${course.title} ${course.category} ${course.description}`.toLowerCase().includes(query.trim().toLowerCase())
  )), [query, category]);
  const closePreview = useRef(() => setSelectedCourse(null)).current;
  const submitSearch = (event) => {
    event.preventDefault();
    catalogRef.current?.scrollIntoView?.({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    resultsHeadingRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="landing">
      <div inert={Boolean(selectedCourse)}>
        <a className="skip-link" href="#landing-main">Skip to content</a>
        <div className="lp-announcement"><span>A space for curious minds.</span><a href="#demo">Explore the shared learner demo <ArrowRight size={13} /></a></div>
        <header className="lp-header lp-wrap" onKeyDown={(event) => { if (event.key === 'Escape') { setMenuOpen(false); menuRef.current?.focus(); } }}>
          <a href="#" className="lp-brand" aria-label="JakIja Learn home"><span><GraduationCap size={25} /></span><strong>jakija<span>.</span></strong><small>LEARN</small></a>
          <button ref={menuRef} className="lp-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-controls="public-nav" aria-expanded={menuOpen}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
          <nav className={menuOpen ? 'is-open' : ''} id="public-nav" aria-label="Public navigation"><a href="#sample-courses" onClick={() => setMenuOpen(false)}>Courses</a><a href="#learning-space" onClick={() => setMenuOpen(false)}>The learning experience</a><a href="#about-project" onClick={() => setMenuOpen(false)}>About JakIja</a></nav>
          <a className="lp-signin" href="#signin">Sign in <ArrowRight size={16} /></a>
        </header>
        <main id="landing-main">
          <section className="lp-hero lp-wrap">
            <div className="lp-hero-copy"><p className="lp-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1>A little curiosity.<br />A whole world of<br /><span>possibility.</span></h1><p className="lp-hero-description">Find your next interest. Build a new skill. Make room for learning that takes you somewhere.</p>
              <form className="lp-search" onSubmit={submitSearch} role="search"><Search size={20} aria-hidden="true" /><label className="lp-visually-hidden" htmlFor="public-course-search">Search sample courses</label><input id="public-course-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What would you like to learn?" type="search" /><button type="submit" aria-label="Find courses"><ArrowRight size={21} /></button></form>
              <div className="lp-hero-links"><a href="#signin-demo">Open learner demo <ArrowRight size={16} /></a><span>No signup. No payment.</span></div>
            </div>
            <div className="lp-hero-media"><div className="lp-photo-frame"><img src="/images/learning-hero.webp" alt="AI-generated editorial image of a student learning in a sunlit library" width="1024" height="768" fetchPriority="high" /><span className="lp-photo-label"><span /> A moment for your next idea</span></div><div className="lp-hero-note"><span className="lp-note-icon"><BookOpen size={23} /></span><div><strong>Your learning,<br />in one place.</strong><p>Pick up a course. Keep your progress. Join the conversation.</p><a href="#learning-space">See the learner space <ArrowRight size={15} /></a></div></div></div>
          </section>
          <section className="lp-facts lp-wrap" aria-label="Inside this showcase"><div><strong>03</strong><span>Sample learning paths<br />Design, React & APIs</span></div><div><LayoutDashboard size={28} strokeWidth={1.4} /><span>Your own workspace<br />Enrolled courses & progress</span></div><div><MessageCircle size={28} strokeWidth={1.4} /><span>Room to connect<br />A shared course classroom</span></div><div><GraduationCap size={30} strokeWidth={1.4} /><span>Made for exploration<br />A free educational demo</span></div></section>
          <section className="lp-catalog lp-wrap" id="sample-courses" ref={catalogRef}>
            <div className="lp-section-top"><div><p className="lp-eyebrow">FOLLOW YOUR CURIOSITY</p><h2 ref={resultsHeadingRef} tabIndex={-1}>Find your next starting point.</h2></div><p>Small beginnings. Useful ideas.<br />Three sample paths to explore.</p></div>
            <div className="lp-catalog-toolbar"><div className="lp-categories" role="group" aria-label="Filter sample courses">{categories.map((item) => <button key={item} type="button" aria-pressed={category === item} className={category === item ? 'is-active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div><p role="status">{visibleCourses.length} {visibleCourses.length === 1 ? 'course' : 'courses'}{query.trim() ? ` for “${query.trim()}”` : ' to explore'}</p></div>
            {visibleCourses.length ? <div className="lp-course-grid">{visibleCourses.map((course) => <article className="lp-course" key={course.id}><button className="lp-course-image" onClick={() => setSelectedCourse(course)} aria-label={`Preview ${course.title}`}><img src={artwork[course.category]} alt="" width="768" height="512" loading="lazy" /><span>{course.category}</span></button><div className="lp-course-body"><div className="lp-course-level"><span>{course.level}</span><span>Sample course</span></div><h3><button onClick={() => setSelectedCourse(course)}>{course.title}</button></h3><p>{course.description}</p><div className="lp-course-meta"><span><BookOpen size={14} />{course.lessons} lessons</span><span><Clock3 size={14} />{course.duration}</span></div><div className="lp-course-bottom"><span className="lp-studio-avatar">J.</span><span>JakIja Demo Studio</span><button onClick={() => setSelectedCourse(course)} aria-label={`View ${course.title}`}><ArrowRight size={19} /></button></div></div></article>)}</div> : <div className="lp-empty"><h3>No courses match that search.</h3><p>Try a different subject, or browse all three sample courses.</p><button className="lp-button lp-button-primary" onClick={() => { setQuery(''); setCategory('All courses'); }}>Show all courses</button></div>}
          </section>
          <section className="lp-experience" id="learning-space"><div className="lp-wrap lp-experience-grid"><div className="lp-workspace-preview"><div className="lp-preview-top"><span className="lp-brand-mini">jakija.</span><span>LEARNER SPACE</span></div><div className="lp-preview-greeting"><span>YOUR LEARNING, IN ONE PLACE</span><h3>Welcome, Demo Learner</h3><p>A little progress, every day.</p></div><div className="lp-preview-course"><div className="lp-preview-art">Aa</div><div><span>CONTINUE LEARNING</span><strong>Interfaces that make sense</strong><p>12 sample lessons · Design</p><div className="lp-progress"><i /></div><small>42% sample progress</small></div></div><div className="lp-preview-classroom"><MessageCircle size={20} /><div><strong>A space for the conversation</strong><span>Open the course classroom in the demo.</span></div><ArrowRight size={17} /></div><p className="lp-preview-caption">Illustrative preview with fictional learning data</p></div><div className="lp-experience-copy"><p className="lp-eyebrow">MORE THAN A COURSE CATALOG</p><h2>A place to learn.<br />A reason to keep going.</h2><p>Good learning needs a little structure and a little company. Your learner space brings both together.</p><ul><li><Check size={18} /><div><strong>Know where you left off</strong><span>See enrolled courses and sample progress at a glance.</span></div></li><li><Check size={18} /><div><strong>Keep the conversation going</strong><span>Explore a course room with persisted classroom messages.</span></div></li><li><Check size={18} /><div><strong>Find something that fits</strong><span>Browse course categories and open a detailed preview.</span></div></li></ul><a href="#signin-demo" className="lp-button lp-button-primary">Take a look inside <ArrowRight size={17} /></a></div></div></section>
          <section className="lp-demo lp-wrap" id="demo"><div><p className="lp-eyebrow">YOU’RE INVITED TO LOOK AROUND</p><h2>Try the learning experience.<br />Your seat is already saved.</h2><p>A real learner account, ready with fictional courses and sample progress. Enter the shared demo to explore the dashboard and classroom.</p><a className="lp-button lp-button-primary" href="#signin-demo">Enter shared demo <ArrowRight size={17} /></a><p className="lp-demo-footnote">The free API host may take up to a minute to wake up.</p></div><div className="lp-demo-account"><div><GraduationCap size={27} /><span>YOUR DEMO PASS</span></div><dl><dt>Email address</dt><dd>{demoAccount.email}</dd><dt>Password</dt><dd>{demoAccount.password}</dd></dl><p>This is a shared learner account. Activity is visible to other demo visitors. Please use fictional information only.</p></div></section>
          <section className="lp-about" id="about-project"><div className="lp-wrap lp-about-grid"><div><p className="lp-eyebrow">BUILT TO LEARN, TOO</p><h2>Curiosity is where<br />this project started.</h2></div><div><p>JakIja Learn is Gusti Rahana’s personal project for learning and educational purposes. It brings together a React learner experience, a NestJS API, Supabase, and Socket.IO.</p><p>The sample courses demonstrate the LMS interface; they don’t include a complete teaching curriculum. The project is inspired by the feature areas of the original JakIja.</p><a className="lp-credit" href="https://github.com/johansantri/jakija">Creator: JakIja <ArrowRight size={15} /></a></div></div></section>
        </main>
        <footer className="lp-footer"><div className="lp-wrap"><div className="lp-footer-main"><a href="#" className="lp-brand"><span><GraduationCap size={24} /></span><strong>jakija<span>.</span></strong><small>LEARN</small></a><p>Keep a little space<br />for something new.</p><div><a href="https://github.com/gustirahana/lms-react-frontend">Frontend source</a><a href="https://github.com/gustirahana/lms-backend">Backend source</a><a href="https://github.com/gustirahana">Gusti Rahana</a></div></div><div className="lp-footer-bottom"><span>JakIja Learn · Learning & educational purposes</span><a href="https://github.com/johansantri/jakija">Creator: JakIja</a><a href="#landing-main">Back to top ↑</a></div></div></footer>
      </div>
      {selectedCourse && <PublicCoursePreview course={selectedCourse} onClose={closePreview} />}
    </div>
  );
}
