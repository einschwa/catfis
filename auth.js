// Authentication and signup/login logic
import { auth, db, storage, onAuthStateChanged } from './firebase-init.js';
import { ref, set, get, child } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import { uploadBytesResumable, ref as storageRef, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js';

// Note: Firebase Auth using email/password would normally require email field. The user requested NRP/password only.
// We'll implement a simple custom auth emulation using Realtime Database for this exercise (not secure for production).

export async function loginWithNRP(nrp, password) {
    // Convert NRP to a synthetic email for Firebase Auth
    const email = `${nrp}@cafis2.local`;
    try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;
        // Read user record from DB (by NRP)
        const snapshot = await get(ref(db, `users/${nrp}`));
        if (!snapshot.exists()) {
            // If user record missing, create a minimal one
            await set(ref(db, `users/${nrp}`), { nrp: Number(nrp), role: 'applicant', authUID: uid });
        } else {
            // ensure authUID is set
            const u = snapshot.val();
            if (!u.authUID) await set(ref(db, `users/${nrp}/authUID`), uid);
        }
        // Save a light session
        localStorage.setItem('currentUser', JSON.stringify({ uid: nrp, role: snapshot.exists() ? snapshot.val().role || 'applicant' : 'applicant' }));
        return { nrp };
    } catch (error) {
        throw error;
    }
}

export async function logout() {
    try {
        await signOut(auth);
    } catch (err) {
        console.warn('Error signing out', err);
    }
    localStorage.removeItem('currentUser');
}

// Keep local session in sync with Firebase Auth state
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        localStorage.removeItem('currentUser');
        return;
    }
    try {
        // find the NRP record with authUID === user.uid
        const snap = await get(ref(db, 'users'));
        if (!snap.exists()) return;
        let found = null;
        snap.forEach((childSnap) => {
            const v = childSnap.val();
            if (v.authUID === user.uid) {
                found = { uid: childSnap.key, role: v.role || 'applicant' };
            }
        });
        if (found) localStorage.setItem('currentUser', JSON.stringify({ uid: found.uid, role: found.role }));
    } catch (err) {
        console.warn('Failed to sync auth state', err);
    }
});

export function getCurrentUser() {
    const raw = localStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
}

export async function signupApplicant(formData, cvFile, transkripFile, onProgress=null) {
    // formData: { name, nrp, whatsapp, motivasi, prioritas, programmingLanguages: [], researchTitles: [], penjelasanJudul, berkasLink }
    const nrp = formData.nrp;
    try {
        // Check if already exists
        const snapshot = await get(ref(db, `users/${nrp}`));
        if (snapshot.exists()) {
            throw new Error('already-signed-up');
        }

        const userObj = {
            name: formData.name,
            nrp: Number(formData.nrp),
            role: 'applicant',
            whatsapp: formData.whatsapp,
            motivasi: formData.motivasi,
            prioritas: Number(formData.prioritas),
            programmingLanguages: formData.programmingLanguages || [],
            researchTitles: formData.researchTitles || [],
            penjelasanJudul: formData.penjelasanJudul || '',
            berkasURL: formData.berkasLink || '',
            status: 'pending',
            appliedAt: new Date().toISOString(),
            // password removed from DB; Auth manages credentials
            authUID: null
        };

        // Create Firebase Auth user with synthetic email
        const email = `${nrp}@cafis2.local`;
        const password = formData.password || Math.random().toString(36).slice(-8);
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        userObj.authUID = cred.user.uid;

        // Save to Realtime DB
        await set(ref(db, `users/${nrp}`), userObj);

        // Auto-login is handled by Firebase Auth; store light session
        localStorage.setItem('currentUser', JSON.stringify({ uid: nrp, role: 'applicant' }));

        return userObj;
    } catch (error) {
        throw error;
    }
}
