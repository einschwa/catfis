// Night mode helper. Persists to localStorage and also writes to Firebase Realtime DB under /settings/nightMode if needed (optional).
import { getCurrentUser } from './auth.js';
import { db } from './firebase-init.js';
import { ref as dbRef, get, set } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';

export async function initNightMode() {
    // Load preference from localStorage first
    let current = localStorage.getItem('nightMode');
    if (current === null) {
        // try load from DB if logged in
        const cu = getCurrentUser();
        if (cu) {
            try {
                const snap = await get(dbRef(db, `users/${cu.uid}/settings/nightMode`));
                if (snap.exists()) current = snap.val() ? 'true' : 'false';
            } catch (err) {
                console.warn('Could not load nightMode from DB', err);
            }
        }
    }
    const enabled = current === 'true';
    setNightMode(enabled);

    const toggle = document.getElementById('nightModeToggle');
    if (toggle) {
        toggle.checked = enabled;
        toggle.addEventListener('change', async (e) => {
            await setNightMode(e.target.checked);
        });
    }
}

export async function setNightMode(enabled) {
    localStorage.setItem('nightMode', enabled ? 'true' : 'false');
    document.documentElement.classList.toggle('dark', enabled);
    // adjust background and font colors via CSS variables
    if (enabled) {
        document.documentElement.style.setProperty('--bg-grad-start', '#0f172a');
        document.documentElement.style.setProperty('--bg-grad-end', '#000814');
        document.documentElement.style.setProperty('--text-color', '#ffffff');
    } else {
        document.documentElement.style.setProperty('--bg-grad-start', '#eff6ff');
        document.documentElement.style.setProperty('--bg-grad-end', '#eef2ff');
        document.documentElement.style.setProperty('--text-color', '#0f172a');
    }

    // persist to DB if user logged in
    try {
        const cu = getCurrentUser();
        if (cu) {
            await set(dbRef(db, `users/${cu.uid}/settings/nightMode`), !!enabled);
        }
    } catch (err) {
        console.warn('Could not persist nightMode to DB', err);
    }
}
