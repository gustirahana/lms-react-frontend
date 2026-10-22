# Public landing design reference

Reference: https://demos.wplms.io/ (observed 2026-10-22).

REA `capture_browser_scenario` launched a temporary, headless Chrome profile and captured the rendered reference at 1280×720, with screenshot, accessibility, and DOM artifacts. The profile was closed by REA after capture. No login or form submission was performed.

Evidence: `ev_bbb4f585f51976a044b0faf8d3bfbb6df0164f918027ffb0ac6d241339736684`.
Screenshot SHA-256: `296f00c18544c735028a1e89f835d81644c83a19f5a03d1d45b70999af381867`.

Observed patterns: white/navy typography, split photographic hero, overlapping navy information panel, course groups, course thumbnails, learner-oriented sections, and footer navigation. The reference's counters, testimonials, instructor biographies, and commerce features do not describe this project and were not reused.

The implementation adapts that hierarchy to JakIja: original generated photography, a public search/filter over the actual three seeded sample courses, keyboard-accessible course previews, a learner-workspace preview, shared demo credentials, educational-purpose disclosure, and `Creator: JakIja` links to the original upstream project. It retains the existing authenticated learner app and server-managed cookie login.

## Assets

The four images in `public/images/` were generated specifically for this project and compressed to WebP. WPLMS images, logos, branding, and source assets are not included. The hero image is illustrative, not a photograph of an actual learner or an endorsement. Images are sized explicitly and course thumbnails load lazily.

- `learning-hero.webp`: fictional learner studying in a library.
- `course-design-notes.webp`: original design-workbook composition with readable headings and interface annotations, revised from the initial generated notebook image.
- `course-react.webp`: an illustrative development workspace.
- `course-backend.webp`: physical networking and computing equipment.
