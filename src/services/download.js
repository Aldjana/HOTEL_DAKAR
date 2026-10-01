import apiClient, { getErrorMessage } from './api/client';
import { tr } from '../i18n';

const filenameFrom = (res, fallback) => {
  const cd = res.headers?.['content-disposition'] || '';
  const m = /filename="?([^";]+)"?/i.exec(cd);
  return m ? m[1] : fallback;
};

// Télécharge un fichier protégé (JWT) puis l'enregistre ou l'ouvre.
export const fetchBlob = async (url, params) => {
  try {
    return await apiClient.get(url, { params, responseType: 'blob' });
  } catch (err) {
    // Les erreurs d'un blob arrivent sous forme de Blob : on les relit pour afficher le vrai message.
    if (err.response?.data instanceof Blob) {
      try {
        const txt = await err.response.data.text();
        err.response.data = JSON.parse(txt);
      } catch { /* garde l'erreur d'origine */ }
    }
    throw err;
  }
};

export const downloadFile = async (url, params, fallbackName = 'fichier') => {
  const res = await fetchBlob(url, params);
  const a = document.createElement('a');
  const href = URL.createObjectURL(res.data);
  a.href = href;
  a.download = filenameFrom(res, fallbackName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10000);
};

// Ouvre un PDF dans un nouvel onglet (aperçu / impression)
export const openPdf = async (url, params) => {
  const win = window.open('', '_blank');
  try {
    const res = await fetchBlob(url, params);
    const href = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    if (win) win.location.href = href;
    else window.location.href = href;
    setTimeout(() => URL.revokeObjectURL(href), 60000);
  } catch (err) {
    if (win) win.close();
    throw new Error(getErrorMessage(err, tr('Impossible de générer le document')));
  }
};
