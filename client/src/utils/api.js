const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    const errorMsg = data.details?.[0]?.message || data.error || 'Something went wrong';
    throw new Error(errorMsg);
  }
  return data;
};

export const api = {
  // Auth
  signup: (body) =>
    fetch(`${API_URL}/api/auth/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  login: (body) =>
    fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  getMe: () =>
    fetch(`${API_URL}/api/auth/me`, { headers: getHeaders() }).then(handleResponse),

  // URLs
  createUrl: (data) =>
    fetch(`${API_URL}/api/urls`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  createUrlBulk: (urlsArray) =>
    fetch(`${API_URL}/api/urls/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ urls: urlsArray }),
    }).then(handleResponse),

  getUrls: (search = '') =>
    fetch(`${API_URL}/api/urls?search=${encodeURIComponent(search)}`, { headers: getHeaders() }).then(handleResponse),

  getUrl: (id) =>
    fetch(`${API_URL}/api/urls/${id}`, { headers: getHeaders() }).then(handleResponse),

  updateUrl: (id, body) =>
    fetch(`${API_URL}/api/urls/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse),

  deleteUrl: (id) =>
    fetch(`${API_URL}/api/urls/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),

  // Analytics
  getAnalytics: (id) =>
    fetch(`${API_URL}/api/urls/${id}/analytics`, { headers: getHeaders() }).then(handleResponse),

  // QR Code
  getQrCode: (id, bg = 'white') =>
    fetch(`${API_URL}/api/urls/${id}/qr?bg=${bg}`, { headers: getHeaders() }).then(handleResponse),

  // Account
  deleteAccount: (password) =>
    fetch(`${API_URL}/api/auth/account`, { method: 'DELETE', headers: getHeaders(), body: JSON.stringify({ password }) }).then(handleResponse),
};
