// Firebase initialization (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-analytics.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyDggKAQJkfg7UWmjbSIZD-gIL_dOznF4n4",
    authDomain: "cafis2.firebaseapp.com",
    databaseURL: "https://cafis2-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cafis2",
    storageBucket: "cafis2.firebasestorage.app",
    messagingSenderId: "126953673025",
    appId: "1:126953673025:web:3c73ab8fb2b567dfc651c0",
    measurementId: "G-M611KWP5NP"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

import { onAuthStateChanged as _onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';

export const onAuthStateChanged = _onAuthStateChanged;

// Expose for legacy global usage if needed
window.firebaseServices = window.firebaseServices || {};
Object.assign(window.firebaseServices, {
    app, analytics, db, auth, storage,
    // Re-export commonly used functions under window.firebaseServices to ease migration
    ref: (dbRef, path) => dbRef(path),
});
