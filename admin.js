import { initNightMode, setNightMode } from './theme.js';
import { getCurrentUser, logout } from './auth.js';
import { db } from './firebase-init.js';
import { ref, get, child, set } from 'https://www.gstatic.com/firebasejs/10.5.0/firebase-database.js';

import { getFileURL } from './storage.js';

initNightMode();

document.addEventListener('DOMContentLoaded', async () => {
    const cu = getCurrentUser();
    if (!cu) {
        alert('Silakan login sebagai admin');
        window.location.href = 'login.html';
        return;
    }

    // Verify role
    try {
    const snapshot = await get(ref(db, `users/${cu.uid}`));
        if (!snapshot.exists() || snapshot.val().role !== 'admin') {
            alert('Akses ditolak. Anda bukan admin.');
            window.location.href = 'home.html';
            return;
        }
    } catch (err) {
        console.error(err);
        alert('Gagal memverifikasi admin.');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        logout();
        window.location.href = 'login.html';
    });

    await loadApplicants();

    const oldClose = document.getElementById('closeModal');
    if (oldClose) oldClose.addEventListener('click', () => closeModal());
    
    // backdrop click should close
    document.getElementById('overlay').addEventListener('click', () => closeModal());

    // new close controls (icon and cancel button)
    const closeIcon = document.getElementById('closeModalIcon');
    if (closeIcon) closeIcon.addEventListener('click', () => closeModal());
    const cancelBtn = document.getElementById('cancelModalBtn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal());

    document.getElementById('statusForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nrp = document.getElementById('modalNrp').value;
        const stageId = document.getElementById('modalStageId').value;
        const status = document.getElementById('modalStatus').value;
        const note = document.getElementById('modalNote').value;
        try {
            // Update stage status
            await set(ref(db, `users/${nrp}/stageStatuses/${stageId}`), status);
            if (note) await set(ref(db, `users/${nrp}/stageStatuses/${stageId}Note`), note);
            await set(ref(db, `users/${nrp}/stageStatuses/${stageId}Date`), new Date().toISOString());
            
            // Update current stage if approved
            if (status === 'approved') {
                const stages = ['berkas', 'seleksi', 'interview', 'pengumuman'];
                const currentIndex = stages.indexOf(stageId);
                if (currentIndex < stages.length - 1) {
                    await set(ref(db, `users/${nrp}/currentStage`), stages[currentIndex + 1]);
                }
            }

            await loadApplicants();
            alert('Status diperbarui');
            closeModal();
        } catch (err) {
            console.error(err);
            alert('Gagal memperbarui status');
        }
    });
});

// Helper functions for modal open/close and keyboard focus trap
function openModal() {
    // show via class on root for transitions
    document.documentElement.classList.add('modal-open');
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'block';
    // move focus into modal
    const modal = document.getElementById('statusModal');
    if (modal) {
        modal.style.display = 'block'; // ensure occupies layout for a11y
        // focus first focusable element
        const focusable = modal.querySelector('select, textarea, input, button, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
    }
    // bind ESC handler
    document.addEventListener('keydown', escHandler);
}

function closeModal() {
    document.documentElement.classList.remove('modal-open');
    const modal = document.getElementById('statusModal');
    if (modal) modal.style.display = 'none';
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'none';
    document.removeEventListener('keydown', escHandler);
}

function escHandler(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
        closeModal();
    }
}

// Applicant modal helpers
function openApplicantModal() {
    document.documentElement.classList.add('modal-open');
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'block';
    const modal = document.getElementById('applicantModal');
    if (modal) {
        modal.style.display = 'block';
        const focusable = modal.querySelector('button, a, [tabindex]:not([tabindex="-1"])');
        if (focusable) focusable.focus();
    }
    document.addEventListener('keydown', escApplicantHandler);
}

function closeApplicantModal() {
    document.documentElement.classList.remove('modal-open');
    const modal = document.getElementById('applicantModal');
    if (modal) modal.style.display = 'none';
    const overlay = document.getElementById('overlay');
    if (overlay) overlay.style.display = 'none';
    document.removeEventListener('keydown', escApplicantHandler);
}

function escApplicantHandler(e) {
    if (e.key === 'Escape' || e.key === 'Esc') closeApplicantModal();
}

// wire applicant modal close buttons/backdrop
const closeApplicantIcon = document.getElementById('closeApplicantIcon');
if (closeApplicantIcon) closeApplicantIcon.addEventListener('click', () => closeApplicantModal());
const closeApplicantBtn = document.getElementById('closeApplicantBtn');
if (closeApplicantBtn) closeApplicantBtn.addEventListener('click', () => closeApplicantModal());
// clicking the backdrop should close whichever modal is open
const overlayEl = document.getElementById('overlay');
if (overlayEl) overlayEl.addEventListener('click', () => { closeModal(); closeApplicantModal(); });

async function loadApplicants() {
    try {
        const snapshot = await get(ref(db, 'users'));
        const tbody = document.getElementById('adminTableBody');
        tbody.innerHTML = '';
        if (!snapshot.exists()) return;
        
        const stages = [
            { id: 'berkas', title: 'Pengumpulan Berkas' },
            { id: 'seleksi', title: 'Seleksi Berkas' },
            { id: 'interview', title: 'Interview' },
            { id: 'pengumuman', title: 'Pengumuman' }
        ];

        snapshot.forEach((childSnap) => {
            const u = childSnap.val();
            if (u.role === 'admin') return; // Skip admin users

            const stageStatuses = u.stageStatuses || {};
            const tr = document.createElement('tr');
            
            // Create status cells for each stage
            const stageCells = stages.map(stage => {
                const status = stageStatuses[stage.id] || 'pending';
                const note = stageStatuses[stage.id + 'Note'] || '';
                return `
                    <td data-label="${stage.title}" class="status-${status}">
                        <div style="display:flex;align-items:center;gap:8px">
                            <span>${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                            <button class="btn small" data-stage="${stage.id}" data-nrp="${u.nrp}" title="${note}">
                                Edit
                            </button>
                        </div>
                    </td>
                `;
            }).join('');

            tr.innerHTML = `
                <td data-label="Nama">${u.name || ''}</td>
                <td data-label="NRP">${u.nrp || ''}</td>
                <td data-label="WhatsApp">${u.whatsapp || ''}</td>
                ${stageCells}
                <td data-label="Aksi">
                    <button class="btn small" data-edit="${u.nrp || ''}">Profil</button>
                </td>
            `;
            tbody.appendChild(tr);

            // Add event listeners for stage buttons
            tr.querySelectorAll('button[data-stage]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const stage = stages.find(s => s.id === e.target.dataset.stage);
                    const nrp = e.target.dataset.nrp;
                    document.getElementById('modalStage').textContent = stage.title;
                    document.getElementById('modalNrp').value = nrp;
                    document.getElementById('modalStageId').value = stage.id;
                    document.getElementById('modalStatus').value = stageStatuses[stage.id] || 'pending';
                    document.getElementById('modalNote').value = stageStatuses[stage.id + 'Note'] || '';
                    // open modal using helper for transitions and focus
                    openModal();
                });
            });
        });

        // Attach click handlers for downloads and edit
        tbody.querySelectorAll('button[data-cv]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-cv');
                if (!url) { alert('Tidak ada CV tersedia'); return; }
                window.open(url, '_blank');
            });
        });
        tbody.querySelectorAll('button[data-tr]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-tr');
                if (!url) { alert('Tidak ada transkrip tersedia'); return; }
                window.open(url, '_blank');
            });
        });
        // 'Profil' buttons: show full applicant details
        tbody.querySelectorAll('button[data-edit]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const nrp = e.currentTarget.getAttribute('data-edit');
                if (!nrp) return;
                try {
                    const snap = await get(child(ref(db), `users/${nrp}`));
                    if (!snap.exists()) { alert('Data pelamar tidak ditemukan'); return; }
                    const u = snap.val();
                    document.getElementById('app_name').textContent = u.name || '';
                    document.getElementById('app_nrp').textContent = u.nrp || '';
                    document.getElementById('app_wp').textContent = u.whatsapp || '';
                    document.getElementById('app_motivasi').textContent = u.motivasi || '';
                    document.getElementById('app_prioritas').textContent = u.prioritas || '';
                    document.getElementById('app_langs').textContent = (u.programmingLanguages || []).join(', ');
                    document.getElementById('app_titles').textContent = (u.researchTitles || []).join(', ');
                    // Resolve uploaded file link. Prefer a storage path stored in `Berkas` (or common fallbacks).
                    const berkasEl = document.getElementById('app_berkas');
                    let displayedLink = 'Lihat Berkas';
                    // possible fields where the DB might have stored the file reference
                    const storageCandidate = u.Berkas || u.berkasPath || u.berkasStorage || u.berkas || u.berkasURL;
                    if (storageCandidate) {
                        try {
                            // If it's already a URL, use it directly; otherwise try to resolve via getFileURL
                            if (/^https?:\/\//i.test(storageCandidate)) {
                                displayedLink = storageCandidate;
                            } else {
                                displayedLink = await getFileURL(storageCandidate);
                            }
                        } catch (err) {
                            console.warn('Could not fetch file URL from storage for', storageCandidate, err);
                            // fallback to any public link stored in berkasLink or the raw candidate
                            displayedLink = u.berkasLink || storageCandidate || '#';
                        }
                    } else if (u.berkasLink) {
                        displayedLink = u.berkasLink;
                    }

                    if (berkasEl) {
                        berkasEl.href = displayedLink;
                        // tampilkan URL langsung jika ada, atau `#` jika tidak
                        berkasEl.textContent = displayedLink === '#' ? '#' : displayedLink;
                        berkasEl.target = '_blank';
                        berkasEl.rel = 'noopener noreferrer';
                    }
                    // open applicant modal
                    openApplicantModal();
                } catch (err) {
                    console.error(err);
                    alert('Gagal memuat data pelamar');
                }
            });
        });
    } catch (err) {
        console.error(err);
        alert('Gagal memuat daftar pelamar');
    }
}
