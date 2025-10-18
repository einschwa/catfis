import { initNightMode, setNightMode } from './theme.js';
import { getCurrentUser, logout } from './auth.js';
import { db } from './firebase-init.js';
import { ref, get, child, set } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-database.js';

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
    });

    document.getElementById('statusForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const nrp = document.getElementById('modalNrp').value;
        const status = document.getElementById('modalStatus').value;
        const note = document.getElementById('modalNote').value;
        try {
            await set(ref(db, `users/${nrp}/status`), status);
                if (note) await set(ref(db, `users/${nrp}/adminNote`), note);
            // append to history
            const histRef = ref(db, `users/${nrp}/history`);
            const entry = { status, note, at: new Date().toISOString() };
            // get existing history then push
            const s = await get(histRef);
            const arr = s.exists() ? s.val() : [];
            arr.push(entry);
            await set(histRef, arr);
            alert('Status diperbarui');
            document.getElementById('statusModal').style.display = 'none';
            await loadApplicants();
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
        snapshot.forEach((childSnap) => {
            const u = childSnap.val();
            // skip admin user in list if desired
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Nama">${u.name || ''}</td>
                <td data-label="NRP">${u.nrp || ''}</td>
                <td data-label="WhatsApp">${u.whatsapp || ''}</td>
                <td data-label="Prioritas">${u.prioritas || ''}</td>
                <td data-label="CV"><button class="btn small" data-cv="${u.cvURL || ''}">CV</button></td>
                <td data-label="Transkrip"><button class="btn small" data-tr="${u.transkripURL || ''}">Transkrip</button></td>
                <td data-label="Status">${u.status || 'pending'}</td>
                <td data-label="Aksi"><button class="btn small" data-edit="${u.nrp}">Edit</button></td>
            `;
            tbody.appendChild(tr);
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
