import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';
import { demoAccount, sampleCourses } from './demo.js';
import './landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <a className="skip-link" href="#landing-main">Skip to content</a>
      <header className="landing-nav landing-wrap">
        <a href="#" className="landing-brand" aria-label="JakIja Learn home"><span className="brand-mark"><GraduationCap size={22} /></span><strong>jakija<span>.</span></strong><span className="landing-brand-label">LEARN</span></a>
        <nav aria-label="Public navigation"><a href="#sample-courses">Sample courses</a><a href="#about-project">About the project</a><a className="landing-signin" href="#signin">Sign in <ArrowRight size={16} /></a></nav>
      </header>
      <main id="landing-main">
        <section className="landing-hero landing-wrap">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">A LITTLE CURIOSITY GOES A LONG WAY</p>
            <h1>Make room for<br />your next <em>idea.</em></h1>
            <p className="landing-lede">A quieter place to find a course, pick up where you left off, and learn something worth making.</p>
            <div className="landing-actions"><a className="landing-button landing-primary" href="#signin-demo">Open learner demo <ArrowRight size={18} /></a><a className="landing-text-link" href="#sample-courses">Browse sample courses</a></div>
            <p className="landing-small">A personal LMS showcase. No signup or payment needed.</p>
          </div>
          <div className="learning-scene" aria-label="Illustrated preview of the sample learner workspace">
            <div className="scene-label"><span>YOUR NEXT CHAPTER</span><BookOpen size={19} /></div>
            <div className="scene-heading">Good things<br />take <span>practice.</span></div>
            <div className="scene-course"><span className="scene-monogram">Aa</span><div><small>DESIGN · SAMPLE COURSE</small><h2>Interfaces that<br />make sense</h2><p>Lesson 5 of 12</p></div></div>
            <div className="scene-progress"><span>Keep your curiosity going</span><strong>42%</strong><div><i /></div></div>
            <p className="scene-caption">Illustrative course preview · fictional learning data</p>
          </div>
        </section>
        <section className="landing-courses landing-wrap" id="sample-courses">
          <div className="landing-section-heading"><div><p className="landing-eyebrow">SOMETHING TO GET YOU STARTED</p><h2>Follow a new thread.</h2></div><p>Three fictional learning paths to explore<br />inside the learner demo.</p></div>
          <div className="landing-course-grid">{sampleCourses.map((course, index) => <article className="landing-course" key={course.id}>
            <a href="#demo" className={`landing-course-art landing-art-${course.accent}`} aria-label={`Preview ${course.title} in the learner demo`}><span className="landing-course-number">0{index + 1}</span><strong>{course.icon}</strong><span>{course.category}</span></a>
            <p className="landing-course-meta">{course.category} / {course.level}</p><h3><a href="#demo">{course.title}</a></h3><p>{course.description}</p><div className="landing-course-details"><span>{course.duration}</span><span>{course.lessons} sample lessons</span></div>
          </article>)}</div>
        </section>
        <section className="landing-demo" id="demo"><div className="landing-wrap landing-demo-grid"><div><p className="landing-eyebrow">TAKE A LOOK AROUND</p><h2>Your seat is<br />already saved.</h2><p>Open a real learner account with sample enrollments, progress, and classroom discussions. This is a shared showcase: activity is visible to other demo visitors.</p><a className="landing-button landing-primary" href="#signin-demo">Enter shared demo <ArrowRight size={18} /></a></div><div className="demo-account"><span className="demo-account-label">SHARED LEARNER ACCOUNT</span><dl><dt>Email</dt><dd>{demoAccount.email}</dd><dt>Password</dt><dd>{demoAccount.password}</dd></dl><p>Use fictional messages only. Sample courses demonstrate the LMS interface; they do not include a complete teaching curriculum. The free API host may need a moment to wake up.</p></div></div></section>
        <section className="landing-about landing-wrap" id="about-project"><div><p className="landing-eyebrow">BUILT TO LEARN, TOO</p><h2>A learning project,<br />inside and out.</h2></div><div><p>JakIja Learn is Gusti Rahana’s educational project, bringing together a React learner experience, a NestJS API, Supabase, and classroom conversations with Socket.IO.</p><p>Inspired by the feature areas of the original JakIja project.</p><a href="https://github.com/johansantri/jakija" target="_blank" rel="noreferrer">Creator: JakIja</a><div className="landing-source-links"><a href="https://github.com/gustirahana/lms-react-frontend">Frontend source</a><a href="https://github.com/gustirahana/lms-backend">Backend source</a></div></div></section>
      </main>
      <footer className="landing-footer landing-wrap"><span>JakIja Learn · Learning & educational purposes</span><a href="https://github.com/johansantri/jakija">Creator: JakIja</a><a href="https://github.com/gustirahana">Built by Gusti Rahana</a></footer>
    </div>
  );
}
