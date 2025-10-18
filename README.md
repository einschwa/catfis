# Asisten Fisika Lab 2 — Applicant site

Lightweight static web app for managing applicants to "Asisten Fisika Laboratorium 2".
This project is implemented with plain HTML/CSS/JS and uses Firebase (Realtime Database, Storage, Auth).

Repository layout (files you'll find in the project root)
- `index.html` — Landing page with links to login/signup.
- `login.html` — Login page (NRP-based login). Calls `auth.js` helpers.
- `signup.html` — Applicant registration form (uploads link to berkas, chooses titles, provides motivation).
- `home.html` — Applicant dashboard. Shows a stage-based progress timeline (Pengumpulan Berkas → Seleksi Berkas → Interview → Pengumuman Akhir).
- `admin.html` — Admin panel. Table of applicants with per-stage controls and a "Profil" action to open a full applicant details modal.
- `style.css` — Main stylesheet: layout, colors, dark theme, modal/backdrop, responsive table and the night-mode switch.
- `theme.js` — Night-mode helper: initializes toggle, persists to localStorage and (optionally) to the user's settings in the Realtime DB.
- `auth.js` — Authentication helpers (login/signup flows wired to Firebase Auth + user profile writes to Realtime DB).
- `firebase-init.js` — Firebase initialization; replace the placeholder config object with your project's settings.
- `storage.js` — Small helpers to upload/get files from Firebase Storage (used during signup in earlier versions).
- `admin.js` — Admin-side logic: loads users from Realtime DB, renders the table, opens modals for per-stage edits and applicant detail view, writes updates back to DB.
- `favicon-phi.svg` — Favicon (Greek letter Phi) used across pages.
- `README.md` — (this file)

Key behaviors and data shapes
- Users are stored under `users/{uidOrNrp}` in Realtime Database. Typical fields used by the UI:
	- `name`, `nrp`, `whatsapp`, `motivasi`, `prioritas`
	- `programmingLanguages`: array of strings
	- `researchTitles`: array of strings
	- `berkasLink` (string): a shareable Google Drive link to the applicant's documents
	- `currentStage`: one of `berkas`, `seleksi`, `interview`, `pengumuman`
	- `stageStatuses`: object, e.g. `stageStatuses.berkas = 'approved'|'rejected'|'pending'`, optional `{stage}Note` and `{stage}Date` keys may be present
	- `role`: `admin` for admin accounts

How to run locally (quick)
1. Serve this directory with a static server (do not use `file://`):

```powershell
# from project root
python -m http.server 8000
# then open http://localhost:8000/index.html
```

2. Firebase setup (required for full functionality)
- Create a Firebase project and enable:
	- Realtime Database (start with test rules for development, then tighten before production)
	- Authentication (Email/Password)
	- Storage (if you plan to upload or host berkas files)
- Replace the Firebase config object in `firebase-init.js` with your project's config.

Developer notes & tips
- Favicon: `favicon-phi.svg` is referenced in every HTML head.
- Modal & backdrop: `style.css` uses a dedicated `.backdrop` element with `backdrop-filter` so modals stay sharp while the page behind is blurred.
- Night mode: controlled by `theme.js` (button with `id="nightModeToggle"`), persisted to localStorage and optionally to `users/{uid}/settings/nightMode`.
- Admin workflows:
	- The admin table (in `admin.html`) fetches `users/*` from the DB and skips users with `role==='admin'`.
	- Per-stage updates are written to `users/{nrp}/stageStatuses/{stageId}` and may update `currentStage` when a stage is approved.
	- Clicking "Profil" opens a details modal that retrieves the user's profile and shows fields like name, motivation, titles and berkas link.

Data & security warnings
- The sample app uses a simplified auth mapping (NRP -> synthetic email) in earlier versions; in production, use real email verification flows.
- Do NOT deploy the app with open Realtime DB rules. Configure security rules to allow only authenticated users to read/write appropriate paths.

Want me to do more?
- I can add:
	- Focus-trap and better ARIA behavior for the modals.
	- Inline preview/download buttons for CV/transcript in the applicant modal.
	- A small script to seed test users into the DB for local testing.
	- Security rule examples for Firebase Realtime Database and Storage.

If you'd like any of the above implemented now, tell me which item and I'll add it.
