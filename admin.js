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

    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('statusModal').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    });
    
    document.getElementById('overlay').addEventListener('click', () => {
        document.getElementById('statusModal').style.display = 'none';
        document.getElementById('overlay').style.display = 'none';
    });

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

            document.getElementById('statusModal').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
            await loadApplicants();
            alert('Status diperbarui');
        } catch (err) {
            console.error(err);
            alert('Gagal memperbarui status');
        }
    });
});

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
                <td data-label="Dokumen">
                    <div style="display:flex;gap:4px">
                        <button class="btn small" data-cv="${u.cvURL || ''}">CV</button>
                        <button class="btn small" data-tr="${u.transkripURL || ''}">Transkrip</button>
                    </div>
                </td>
                <td data-label="Aksi">
                    <button class="btn small">Profil</button>
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
                    document.getElementById('statusModal').style.display = 'block';
                    document.getElementById('overlay').style.display = 'block';
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
        tbody.querySelectorAll('button[data-edit]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nrp = e.currentTarget.getAttribute('data-edit');
                document.getElementById('modalNrp').value = nrp;
                document.getElementById('statusModal').style.display = 'block';
            });
        });
    } catch (err) {
        console.error(err);
        alert('Gagal memuat daftar pelamar');
    }
}
