// Simple storage helpers for downloads and metadata
import { storage } from './firebase-init.js';
import { ref as storageRef, getMetadata, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js';

export async function getFileURL(path) {
    const ref = storageRef(storage, path);
    return await getDownloadURL(ref);
}

export async function getFileMetadata(path) {
    const ref = storageRef(storage, path);
    return await getMetadata(ref);
}

export function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const sizes = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes/Math.pow(1024,i)).toFixed(2)} ${sizes[i]}`;
}
