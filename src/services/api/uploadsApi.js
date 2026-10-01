import apiClient, { unwrap } from './client';

export const uploadsApi = {
  status: () => apiClient.get('/uploads/status').then(unwrap),
  // Envoie une image au backend, qui la stocke sur Cloudinary et renvoie { url, public_id, ... }
  image: (file, folder = 'misc') => {
    const fd = new FormData();
    fd.append('folder', folder);
    fd.append('file', file);
    return apiClient.post('/uploads/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }).then(unwrap);
  },
};
