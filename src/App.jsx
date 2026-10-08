import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  X,
} from 'lucide-react';
import { getDashboard, getCourses } from './api/client.js';
import { getSession, isUnauthorized, login, logout, refreshSession } from './api/auth.js';
import { appConfig } from './config.js';
import { openRealtimeChannels } from './realtime.js';

const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'My courses', icon: BookOpen },
  { label: 'Explore courses', icon: Compass },
];

function initials(value = '') {
  return value.trim().split(/[\s@._-]+/).filter(Boolean).slice(0, 2)
    .map((part) => part[0].toUpperCase()).join('');
}

function mergeMessages(current, incoming) {
  const messagesById = new Map(current.map((message) => [message.id, message]));
  for (const message of incoming) {
    if (message && typeof message.id === 'string' && typeof message.body === 'string') {
      messagesById.set(message.id, message);
    }
  }
  return [...messagesById.values()].sort((left, right) => (left.created_at || '').localeCompare(right.created_at || ''));
}

function mergeNotifications(current, incoming) {
  const itemsById = new Map(current.map((notification) => [notification.id, notification]));
  for (const notification of incoming) {
    if (notification && typeof notification.id === 'string') itemsById.set(notification.id, notification);
  }
  return [...itemsById.values()].sort((left, right) => (right.created_at || '').localeCompare(left.created_at || ''));
}

function LoginScreen({ onLogin, error, busy }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      await onLogin(email.trim(), password);
    } finally {
      setPassword('');
    }
  };

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-mark"><GraduationCap size={21} strokeWidth={2.2} /></div>
        <span className="section-kicker">LEARNER SPACE</span>
        <h1>Welcome back</h1>
        <p>Sign in to continue your learning.</p>
        <label htmlFor="login-email">Email address</label>
        <input id="login-email" autoComplete="username" type="email" required value={email}
          onChange={(event) => setEmail(event.target.value)} />
        <label htmlFor="login-password">Password</label>
        <input id="login-password" autoComplete="current-password" type="password" required value={password}
          onChange={(event) => setPassword(event.target.value)} />
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button button-dark auth-submit" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}

function Sidebar({ active, onNavigate, open, onClose, user, onLogout, modalOpen }) {
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const mobileViewport = window.matchMedia('(max-width: 850px)');
    if (!mobileViewport.matches) return undefined;
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !sidebarRef.current) return;
      const focusable = [...sidebarRef.current.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !sidebarRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !sidebarRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleViewportChange = (event) => {
      if (!event.matches) onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    mobileViewport.addEventListener('change', handleViewportChange);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      mobileViewport.removeEventListener('change', handleViewportChange);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [open]);

  return (
    <>
      {open && <button className="mobile-scrim" tabIndex={-1} aria-hidden="true" aria-label="Close menu" onClick={onClose} />}
      <aside id="learner-sidebar" ref={sidebarRef} className={`sidebar ${open ? 'sidebar-open' : ''}`} role={open ? 'dialog' : undefined} aria-modal={open ? 'true' : undefined} aria-label="Learner navigation" inert={modalOpen}>
        <div className="brand-row">
          <div className="brand-mark"><GraduationCap size={21} strokeWidth={2.2} /></div>
          <span className="brand-name">jakija<span className="brand-period" aria-hidden="true">.</span></span>
          <button ref={closeButtonRef} className="mobile-close icon-button" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>
        <div className="workspace-label">LEARNER SPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? 'nav-active' : ''}`}
              aria-current={active === label ? 'page' : undefined}
              onClick={() => { onNavigate(label); onClose(); }}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="profile-row" onClick={onLogout} title="Sign out">
            <div className="avatar avatar-profile" aria-hidden="true">{initials(user?.displayName || user?.email)}</div>
            <span className="profile-copy">
              <strong>{user?.displayName || user?.email}</strong>
              <span>{user?.role || 'Learner'} · Sign out</span>
            </span>
            <LogOut size={16} className="profile-more" />
          </button>
        </div>
      </aside>
    </>
  );
}

function CourseArt({ course, compact = false }) {
  return (
    <div className={`course-art art-${course.accent} ${compact ? 'course-art-compact' : ''}`} aria-hidden="true">
      <div className="art-orb art-orb-one" />
      <div className="art-orb art-orb-two" />
      <div className="art-symbol">{course.icon}</div>
      <span className="art-index">{course.category}</span>
      <span className="art-scribble">JakIja Learn</span>
    </div>
  );
}

function CourseCard({ course, onOpen, progress = false }) {
  return (
    <article className="course-card">
      <button className="course-art-button" onClick={() => onOpen(course)} aria-label={`Open ${course.title}`}>
        <CourseArt course={course} />
      </button>
      <div className="course-card-body">
        <div className="course-meta-row"><span className="course-category">{course.category}</span></div>
        <button className="course-title-button" onClick={() => onOpen(course)}><h3>{course.title}</h3></button>
        <div className="instructor-row">
          <span className={`avatar avatar-${course.accent}`} aria-hidden="true">{initials(course.instructor)}</span>
          <span>{course.instructor}</span>
        </div>
        <div className="course-footer">
          <span><Clock3 size={14} /> {course.duration}</span>
          <span>{course.lessons} lessons</span>
          <span className="level-label">{course.level}</span>
        </div>
        {progress && <div className="course-progress">
          <div className="progress-meta"><span>Your progress</span><span>{course.progress}%</span></div>
          <div className="progress-track" role="progressbar" aria-valuenow={course.progress} aria-valuemin="0" aria-valuemax="100">
            <span style={{ width: `${course.progress}%` }} />
          </div>
        </div>}
      </div>
    </article>
  );
}

function CourseDialog({ course, onClose, userId, roomEnabled, messages, messageError, onSendMessage }) {
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const courseId = course?.id;
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!courseId) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll(
        'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )].filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [courseId]);

  if (!course) return null;
  const submit = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = new FormData(form).get('message');
    if (typeof input === 'string' && input.trim()) {
      onSendMessage(course.id, input.trim());
      form.reset();
    }
  };
  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className="course-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-description" tabIndex={-1}>
        <button ref={closeButtonRef} className="dialog-close icon-button" onClick={onClose} aria-label="Close course details"><X size={19} /></button>
        <CourseArt course={course} />
        <div className="dialog-copy">
          <div className="course-category">{course.category} <span className="meta-dot" /> {course.level}</div>
          <h2 id="dialog-title">{course.title}</h2>
          <p id="dialog-description">{course.description}</p>
          <div className="dialog-instructor">
            <span className={`avatar avatar-${course.accent}`} aria-hidden="true">{initials(course.instructor)}</span>
            <div><strong>{course.instructor}</strong><span>Course instructor</span></div>
          </div>
          <div className="dialog-stats"><span><Clock3 size={16} /> {course.duration}</span><span><BookOpen size={16} /> {course.lessons} lessons</span></div>
          {roomEnabled ? <section className="classroom-panel" aria-label="Course classroom">
            <div className="section-heading"><div><span className="section-kicker">COURSE ROOM</span><h3>Classroom</h3></div></div>
            <div className="classroom-messages" aria-live="polite">
              {messages.length ? messages.map((message) => <article className="classroom-message" key={message.id}>
                <div className="classroom-message-meta"><strong>{message.sender_id === userId ? 'You' : 'Class member'}</strong><time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time></div>
                <p>{message.body}</p>
              </article>) : <p className="classroom-empty">No messages in this classroom yet.</p>}
            </div>
            {messageError && <p className="auth-error" role="alert">{messageError}</p>}
            <form className="classroom-composer" onSubmit={submit}>
              <label className="visually-hidden" htmlFor="classroom-message">Message</label>
              <input id="classroom-message" name="message" maxLength="4000" placeholder="Write a message…" required />
              <button className="button button-dark" type="submit">Send</button>
            </form>
          </section> : <p className="classroom-restricted">Classroom access is available to enrolled learners.</p>}
          <button className="button button-outline dialog-action" onClick={onClose}>Close course details</button>
        </div>
      </section>
    </div>
  );
}

function EmptyState({ title, detail, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><BookOpen size={21} /></div>
      <h3>{title}</h3>
      <p>{detail}</p>
      {action && <button className="button button-outline" onClick={onAction}>{action}</button>}
    </div>
  );
}

function Metric({ label, value, suffix, icon: Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-label">{label}<span className="stat-icon stat-icon-violet"><Icon size={15} /></span></div>
      <div className="stat-value">{value}<span>{suffix}</span></div>
    </article>
  );
}

function App() {
  const [authStatus, setAuthStatus] = useState('loading');
  const [currentUser, setCurrentUser] = useState(null);
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardReload, setDashboardReload] = useState(0);
  const [catalog, setCatalog] = useState([]);
  const [catalogError, setCatalogError] = useState('');
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogReload, setCatalogReload] = useState(0);
  const [activeNav, setActiveNav] = useState('Overview');
  const [activeCategory, setActiveCategory] = useState('All courses');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [classroomMessages, setClassroomMessages] = useState([]);
  const [classroomError, setClassroomError] = useState('');
  const realtimeRef = useRef(null);
  const selectedCourseRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  selectedCourseRef.current = selectedCourse?.id || null;

  useEffect(() => {
    if (authStatus === 'signed-in') return;
    setDashboard(null);
    setCatalog([]);
    setNotifications([]);
    setClassroomMessages([]);
    setSelectedCourse(null);
    setNotice('');
  }, [authStatus]);

  const restoreSession = async (signal) => {
    setAuthError('');
    try {
      const user = await getSession({ signal });
      if (!signal?.aborted) {
        setCurrentUser(user);
        setAuthStatus('signed-in');
      }
    } catch (error) {
      if (signal?.aborted) return;
      if (!isUnauthorized(error)) {
        setAuthStatus('error');
        setAuthError(error.message);
        return;
      }
      try {
        const user = await refreshSession({ signal });
        if (!signal?.aborted) {
          setCurrentUser(user);
          setAuthStatus('signed-in');
        }
      } catch (refreshError) {
        if (signal?.aborted) return;
        setCurrentUser(null);
        setAuthStatus(isUnauthorized(refreshError) ? 'signed-out' : 'error');
        if (!isUnauthorized(refreshError)) setAuthError(refreshError.message);
      }
    }
  };

  useEffect(() => {
    document.title = `${appConfig.name} — Learning, at your pace`;
    const controller = new AbortController();
    restoreSession(controller.signal);
    return () => controller.abort();
  }, []);

  const signIn = async (email, password) => {
    setAuthBusy(true);
    setAuthError('');
    try {
      const user = await login(email, password);
      setDashboard(null);
      setCatalog([]);
      setNotifications([]);
      setClassroomMessages([]);
      setSelectedCourse(null);
      setNotice('');
      setCurrentUser(user);
      setAuthStatus('signed-in');
      return true;
    } catch (error) {
      setAuthError(isUnauthorized(error) ? 'Email or password is incorrect.' : error.message);
      return false;
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    realtimeRef.current?.close();
    realtimeRef.current = null;
    setCurrentUser(null);
    setDashboard(null);
    setCatalog([]);
    setNotifications([]);
    setClassroomMessages([]);
    setSelectedCourse(null);
    setNotice('');
    setAuthError('');
    setAuthStatus('signing-out');
    try {
      await logout();
    } catch (error) {
      if (!isUnauthorized(error)) {
        setAuthError(`Could not confirm sign-out with the server. Your browser is signed out locally, but the server session may still be active. ${error.message}`);
      }
    } finally {
      setAuthStatus('signed-out');
    }
  };

  useEffect(() => {
    if (authStatus !== 'signed-in') return undefined;
    const controller = new AbortController();
    setDashboardLoading(true);
    setDashboardError('');
    const loadDashboard = async () => {
      try {
        return await getDashboard({ signal: controller.signal });
      } catch (error) {
        if (!isUnauthorized(error)) throw error;
        await refreshSession({ signal: controller.signal });
        return getDashboard({ signal: controller.signal });
      }
    };
    loadDashboard()
      .then((data) => {
        setDashboard(data);
        setCurrentUser((user) => ({ ...user, ...data.learner }));
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          if (isUnauthorized(error)) {
            setCurrentUser(null);
            setAuthStatus('signed-out');
          } else {
            setDashboardError(error.message);
          }
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDashboardLoading(false);
      });
    return () => controller.abort();
  }, [authStatus, dashboardReload]);

  useEffect(() => {
    if (authStatus !== 'signed-in') return undefined;
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError('');
    getCourses({ signal: controller.signal })
      .then(setCatalog)
      .catch((error) => {
        if (!controller.signal.aborted) setCatalogError(error.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });
    return () => controller.abort();
  }, [authStatus, catalogReload]);

  useEffect(() => {
    if (authStatus !== 'signed-in') return undefined;
    const realtime = openRealtimeChannels({
      onNotification: (notification) => {
        setNotifications((current) => mergeNotifications(current, [notification]));
        setNotice(typeof notification?.body === 'string' ? notification.body : 'A new notification is available.');
      },
      onNotifications: (items) => setNotifications((current) => mergeNotifications(current, items)),
      onNotificationRead: (event) => {
        setNotifications((current) => current.map((notification) => notification.id === event?.id
          ? { ...notification, read_at: event.readAt }
          : notification));
      },
      onError: () => setNotice('Realtime connection is unavailable. Live updates will resume when reconnected.'),
      onClassroomHistory: (courseId, messages) => {
        if (courseId === selectedCourseRef.current) {
          setClassroomMessages((current) => mergeMessages(current, messages));
        }
      },
      onRoomError: (reason) => setClassroomError(reason === 'FORBIDDEN'
        ? 'This classroom is only available to enrolled learners.'
        : 'The classroom could not load. Check your connection and try again.'),
    });
    const removeMessageListener = realtime.onClassroomMessage((message) => {
      if (message?.course_id === selectedCourseRef.current) {
        setClassroomMessages((current) => mergeMessages(current, [message]));
      }
    });
    realtimeRef.current = realtime;
    return () => {
      realtime.close();
      removeMessageListener();
      realtimeRef.current = null;
    };
  }, [authStatus]);

  useEffect(() => {
    setClassroomMessages([]);
    setClassroomError('');
    const hasEnrollment = dashboard?.courses.some((course) => course.id === selectedCourse?.id);
    realtimeRef.current?.setCourse(hasEnrollment ? selectedCourse.id : null);
    return () => realtimeRef.current?.setCourse(null);
  }, [selectedCourse?.id, authStatus, dashboard]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 8000);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const activeCourses = dashboard?.courses || [];
  const categories = useMemo(() => ['All courses', ...new Set(catalog.map((course) => course.category))], [catalog]);
  const filteredCatalog = useMemo(() => catalog.filter((course) => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || `${course.title} ${course.instructor} ${course.category}`.toLowerCase().includes(query);
    const matchesCategory = activeCategory === 'All courses' || course.category === activeCategory;
    return matchesSearch && matchesCategory;
  }), [activeCategory, catalog, search]);
  const displayedCourses = activeNav === 'My courses' ? activeCourses : filteredCatalog;
  const displayedError = activeNav === 'My courses' ? dashboardError : catalogError;
  const displayedLoading = activeNav === 'My courses' ? dashboardLoading : catalogLoading;
  const displayName = dashboard?.learner?.displayName || currentUser?.displayName || currentUser?.email || '';
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date()).toUpperCase();
  const unreadNotifications = notifications.filter((notification) => !notification.read_at);

  const sendClassroomMessage = (courseId, body) => {
    setClassroomError('');
    realtimeRef.current?.sendClassroomMessage(courseId, body, (result) => {
      if (!result?.ok) setClassroomError(result?.error === 'FORBIDDEN' ? 'You no longer have access to this classroom.' : 'Message could not be sent. Please try again.');
    });
  };

  if (authStatus === 'loading' || authStatus === 'signing-out') {
    return <main className="auth-screen"><p role="status">{authStatus === 'loading' ? 'Checking your session…' : 'Signing out…'}</p></main>;
  }
  if (authStatus !== 'signed-in') {
    return <LoginScreen onLogin={signIn} error={authError || (authStatus === 'error' ? 'Unable to check your session. Try signing in again.' : '')} busy={authBusy} />;
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content" inert={menuOpen || Boolean(selectedCourse)} aria-hidden={menuOpen || selectedCourse ? 'true' : undefined}>Skip to course content</a>
      <Sidebar active={activeNav} onNavigate={setActiveNav} open={menuOpen} onClose={() => setMenuOpen(false)} user={currentUser} onLogout={signOut} modalOpen={Boolean(selectedCourse)} />
      <main className="main-area" inert={menuOpen || Boolean(selectedCourse)} aria-hidden={menuOpen || selectedCourse ? 'true' : undefined}>
        <header className="topbar">
          <button ref={mobileMenuButtonRef} className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="learner-sidebar"><Menu size={20} /></button>
          <div className="breadcrumb"><span>My space</span><span className="breadcrumb-slash" aria-hidden="true">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-actions">
            <label className="global-search"><Search size={16} /><input aria-label="Search courses" placeholder="Search…" value={search} onChange={(event) => { setSearch(event.target.value); setActiveNav('Explore courses'); }} /></label>
            <button className="icon-button topbar-help" aria-label="Help" title="Help"><CircleHelp size={19} /></button>
            <button className="notification-button icon-button" aria-label={`Notifications${unreadNotifications.length ? `, ${unreadNotifications.length} unread` : ''}`} onClick={() => {
              const notification = unreadNotifications[0];
              if (notification) {
                setNotice(notification.body || notification.title || 'Notification marked as read.');
                realtimeRef.current?.markNotificationRead(notification.id, (result) => {
                  if (!result?.ok) setNotice('Could not mark the notification as read.');
                });
              } else {
                setNotice('You’re all caught up on notifications');
              }
            }}><Bell size={19} />{unreadNotifications.length > 0 && <i />}</button>
            <div className="topbar-divider" />
            <button className="topbar-profile" onClick={signOut} title="Sign out" aria-label="Sign out">
              <span className="avatar avatar-profile" aria-hidden="true">{initials(currentUser?.displayName || currentUser?.email)}</span><ChevronDown size={15} />
            </button>
          </div>
        </header>

        <div id="main-content" className="page-content" tabIndex={-1}>
          <section className="welcome-row">
            <div><div className="date-kicker"><span className="live-dot" /> {dateLabel}</div>
              <h1>{activeNav === 'Overview' ? `Welcome, ${displayName}` : activeNav}<span className="heading-wave" aria-hidden="true">✳</span></h1>
              <p className="welcome-subtitle">Your learning, in one place.</p>
            </div>
            <button className="button button-outline plan-button" onClick={() => setActiveNav('My courses')}><CalendarDays size={16} /> View my courses</button>
          </section>

          {activeNav === 'Overview' && <>
            {dashboardError && <div className="api-notice" role="alert"><span>Dashboard could not load: {dashboardError}</span><button className="text-link" onClick={() => setDashboardReload((value) => value + 1)}>Retry</button></div>}
            {dashboardLoading ? <p className="catalog-status" role="status">Loading your dashboard…</p> : dashboard && <>
              <section className="stats-grid" aria-label="Learning summary">
                <Metric label="HOURS LEARNED" value={dashboard.stats.hoursLearned} suffix="hrs" icon={Clock3} />
                <Metric label="COURSES IN PROGRESS" value={dashboard.stats.coursesInProgress} suffix="courses" icon={BookOpen} />
                <Metric label="CERTIFICATES" value={dashboard.stats.certificates} suffix="earned" icon={GraduationCap} />
              </section>
              <section className="continue-section">
                <div className="section-heading"><div><span className="section-kicker">YOUR LEARNING</span><h2>Continue a course</h2></div>
                  {activeCourses.length > 0 && <button className="text-link" onClick={() => setActiveNav('My courses')}>View all courses <ArrowRight size={15} /></button>}
                </div>
                {dashboardLoading ? <p className="catalog-status" role="status">Loading enrolled courses…</p>
                  : activeCourses.length ? <div className="course-grid">{activeCourses.slice(0, 2).map((course) => <CourseCard key={course.id} course={course} progress onOpen={setSelectedCourse} />)}</div>
                    : <EmptyState title="Your learning starts here" detail="You have no active courses yet. Explore the catalog to find a course that fits your goals." action="Explore courses" onAction={() => setActiveNav('Explore courses')} />}
              </section>
            </>}
          </>}

          {activeNav !== 'Overview' && <section className="catalog-section">
            <div className="section-heading catalog-heading"><div><span className="section-kicker">{activeNav === 'My courses' ? 'YOUR LEARNING' : 'COURSE CATALOG'}</span><h2>{activeNav === 'My courses' ? 'Enrolled courses' : 'Find a course'}</h2></div></div>
            {activeNav === 'Explore courses' && <div className="catalog-toolbar"><div className="category-tabs" role="group" aria-label="Filter courses by category">{categories.map((category) => <button key={category} type="button" aria-pressed={activeCategory === category} className={`category-tab ${activeCategory === category ? 'category-active' : ''}`} onClick={() => setActiveCategory(category)}>{category}</button>)}</div></div>}
            {displayedError && <div className="api-notice" role="alert"><span>Courses could not load: {displayedError}</span><button className="text-link" onClick={() => activeNav === 'My courses' ? setDashboardReload((value) => value + 1) : setCatalogReload((value) => value + 1)}>Retry</button></div>}
            {displayedLoading ? <p className="catalog-status" role="status">Loading {activeNav === 'My courses' ? 'your courses' : 'the catalog'}…</p>
              : displayedCourses.length ? <div className="course-grid">{displayedCourses.map((course) => <CourseCard key={course.id} course={course} progress={activeNav === 'My courses'} onOpen={setSelectedCourse} />)}</div>
                : <EmptyState title={activeNav === 'My courses' ? 'No courses in your learning list' : 'No published courses yet'} detail={activeNav === 'My courses' ? 'When you enroll in a course, it will appear here.' : 'The catalog will show courses once they are published.'} action={activeNav === 'My courses' ? 'Explore courses' : undefined} onAction={() => setActiveNav('Explore courses')} />}
          </section>}

          <footer className="page-footer"><span>© {new Date().getFullYear()} {appConfig.name}</span><span>Learning at your own pace.</span><a href="https://github.com/johansantri/jakija" target="_blank" rel="noreferrer">Creator: JakIja</a></footer>
        </div>
      </main>
      <CourseDialog course={selectedCourse} onClose={() => setSelectedCourse(null)} userId={currentUser?.id}
        roomEnabled={activeCourses.some((course) => course.id === selectedCourse?.id)} messages={classroomMessages}
        messageError={classroomError} onSendMessage={sendClassroomMessage} />
      {notice && <div className="toast" role="status" inert={menuOpen || Boolean(selectedCourse)} aria-hidden={menuOpen || selectedCourse ? 'true' : undefined}>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={14} /></button></div>}
    </div>
  );
}

export default App;
