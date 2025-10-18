# Asisten Fisika Lab 2 — Applicant site

This repository contains a small web app for applicants to apply for "Asisten Fisika Laboratorium 2". It uses Firebase Realtime Database and Firebase Storage, and Firebase Authentication (email/password) where the email is synthesized from the NRP (`{nrp}@cafis2.local`).

Files of interest
- `firebase-init.js` — initialize Firebase with provided config
- `auth.js` — login/signup code (uses Firebase Auth + Realtime DB for profile data)
- `storage.js` — helpers for Storage operations
- `theme.js` & `style.css` — night mode and styling
- `index.html`, `login.html`, `signup.html`, `home.html`, `admin.html` — pages

Local testing (recommended)
1. Serve the directory using a static server (do not open `file://` directly). Example using PowerShell with Python:

```powershell
# from project root
python -m http.server 8000
# then open http://localhost:8000/index.html
```

2. Firebase setup (one-time)
- Create a Firebase project in the Firebase Console.
- Enable Realtime Database and create a database in the region of your choice. Choose "Start in test mode" for initial testing (but configure rules before production).
- Enable Firebase Storage and set up a storage bucket.
- Enable Authentication -> Email/Password provider.
- Replace the Firebase config object in `firebase-init.js` with your project's config values.

3. CORS/Storage
- If you run into CORS issues with uploads, ensure that your Firebase Storage CORS is configured properly (see Firebase docs). Serving via HTTP usually avoids many file:// CORS problems.

Notes & caveats
- For demo simplicity, the app uses a synthetic email `{nrp}@cafis2.local`. For production you should use real email flows.
- Passwords are handled by Firebase Authentication; no plaintext passwords should be stored in the Realtime DB.
- This project is a reference implementation and needs security hardening for production.

Optional: quick serve script for PowerShell
- Run `.	ools\serve.ps1` (on Windows PowerShell) to start a simple static server (uses Python if available).

If you want, I can:
- Replace the synthetic-email scheme with a real email-based signup flow.
- Harden DB & Storage security rules.
- Add CI or automated tests.
