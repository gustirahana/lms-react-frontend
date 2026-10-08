# JakIja Learn — frontend

React and Vite learner interface for the JakIja-inspired LMS. This project is for learning and educational purposes. The visual system keeps JakIja’s light palette and learner focus while taking layout cues from the [DashLite LMS reference](https://dashlite.net/demo2/lms/index.html); it does not reuse DashLite assets.

## Local setup

```sh
cp .env.example .env.local
npm ci
npm run dev
```

Use Node.js `^20.19.0`, `^22.13.0`, or `>=24.0.0`, as required by the pinned Vite, ESLint, and Vitest toolchain.

Vite serves the frontend at `http://localhost:5173` and proxies `/api` and `/socket.io` to the NestJS server at `http://localhost:4000`.

## Public build variables

Every `VITE_*` value is compiled into the browser bundle or sent as public client metadata. **Do not put passwords, API keys, Supabase keys, session tokens, or other secrets in these variables.** The app sends the name, version, and device values as `X-App-Name`, `X-App-Version`, and `X-App-Device` HTTP headers and as non-secret Socket.IO handshake metadata. They do not create or authenticate a bearer token.

| Variable | Default | Purpose |
| --- | --- | --- |
| `VITE_APP_NAME` | `JakIja Learn` | Public application name |
| `VITE_APP_VERSION` | `0.1.0` | Public frontend version |
| `VITE_APP_DEVICE` | `web` | Public client label; accepts `web` or `mobile` |
| `VITE_API_URL` | empty | Optional API origin; empty uses the current origin and `/api` |
| `VITE_SOCKET_URL` | empty | Optional Socket.IO origin; defaults to `VITE_API_URL` or the current origin |

API and Socket.IO origin variables must be absolute HTTP(S) origins without a path, query, fragment, or embedded credentials. Configure production routing to send `/api` and `/socket.io` to the backend.
Production builds reject every explicitly configured non-HTTPS API/socket origin, including localhost. Leave both origin values empty for same-origin localhost preview; the app refuses to run on a public HTTP origin.
The Vite config also validates app metadata and the `web`/`mobile` device label before serving or building.

## Session, API, and realtime contracts

The frontend uses `credentials: 'include'` for API requests. The backend owns the `HttpOnly`, `Secure` (in production), `SameSite` session cookie. On startup the app checks `GET /api/auth/session`, tries `POST /api/auth/refresh` once after a `401`, and displays the learner workspace only after the backend confirms a session. Sign-in posts `{ "email", "password" }` to `/api/auth/login`; sign-out posts to `/api/auth/logout`. Session and login responses contain `{ "user": { "id", "email" } }`; the protected dashboard supplies the learner profile.

- `GET /api/dashboard` returns the authenticated learner, real learning metrics, and active enrollments. The app validates the response and shows loading, empty, and retryable error states.
- `GET /api/courses` lists published courses. It is used for the explore catalog and is validated before rendering.
- The `/notifications` Socket.IO namespace authenticates with the session cookie. The client emits `notification:subscribe`, handles the subscription history and `notification:new`, and emits `notification:read` with `{ notificationId }`.
- The `/classroom` namespace uses server-authorized course rooms. The client emits `course:join` and `course:leave` with `{ courseId }`, requests `classroom:history:request` with `{ courseId }`, and sends `classroom:message:send` with `{ courseId, body }`. The server checks enrollment before joining or sending. No client-selected user room or bearer token is used.

The backend must allow the frontend origin for credentialed HTTP and Socket.IO requests. It must set cookie attributes that match the deployment topology.

## Production build

```sh
npm ci
npm run lint
npm test
npm run build
npm run preview
```

The current dependency versions are exact-pinned in `package.json` and `package-lock.json`.
GitHub Actions runs `npm ci`, `npm audit --audit-level=high`, ESLint, the auth-flow tests, and the production build on pushes and pull requests targeting `main`.

## Verification

- `npm run build` passed with Vite 8.3.3 (1,929 modules transformed).
- `npm audit --audit-level=high` found zero vulnerabilities in the current lockfile.
- `npm run lint` checks JavaScript and JSX plus the React Rules of Hooks and effect dependency rules. Automated JSX accessibility linting is not enabled because the current React and JSX accessibility plugins do not declare ESLint 10 peer support; modal, drawer, toast, and skip-link behavior have been checked manually in the browser.
- `npm test` runs repeatable coverage for session restoration/expiry, failed logout privacy behavior, clearing rejected login passwords, and sending public `X-App-*` metadata with cookie credentials but no bearer token.
- Vite config tests reject invalid public metadata, unsupported device labels, and insecure or malformed API/socket origins. Build-time substitution was also checked with temporary `VITE_APP_NAME`, `VITE_APP_VERSION`, and `VITE_APP_DEVICE` values.
- Browser checks covered the dashboard at 1440×900 and the dashboard and course dialog at 390×844 and 320×720. At both compact sizes, the search field remains available and document width matched the viewport content width without horizontal overflow.
- Keyboard checks confirmed first-Tab skip-link focus, drawer/dialog focus trapping and restoration, Escape dismissal, and that a toast already visible before opening a course is excluded from the modal accessibility tree. The reduced-motion stylesheet is present; browser-level preference emulation was not available in this run.
- Browser sign-in, cookie persistence, and authorized Socket.IO room flows remain unverified pending a dedicated test account and deployment origin. Separate live loopback checks against the production-mode API confirmed the hosted readiness query, public course response, unauthenticated dashboard denial, credentialed CORS headers, and no-cookie rejection by both Socket.IO namespaces. Responsive checks used temporary local-only `.invalid` learner/course data.
