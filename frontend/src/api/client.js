const BASE = '/v1';

function getToken() {
  return localStorage.getItem('mp_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('mp_token', token);
  else localStorage.removeItem('mp_token');
}

async function request(method, path, body, idempotencyKey) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

async function upload(path, file, fieldName = 'file', extraFields = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const formData = new FormData();
  formData.append(fieldName, file);
  for (const [key, value] of Object.entries(extraFields)) formData.append(key, value);

  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed: ${res.status}`);
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body, idempotencyKey) => request('POST', path, body, idempotencyKey),
  patch: (path, body) => request('PATCH', path, body),
  upload,
};
