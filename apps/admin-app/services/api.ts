
// Real API implementation connecting to auth-service backend

const API_BASE_URL = '/api';

// Simulated persistent storage for non-sensitive data (user profile)
const storage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, val: string) => localStorage.setItem(key, val),
  remove: (key: string) => localStorage.removeItem(key)
};

function handleAuthError(status: number) {
  if (status === 401 || status === 403) {
    // Clear client-side session info and redirect to login
    storage.remove('taaza_token');
    storage.remove('taaza_user');
    window.location.href = '/auth/login';
  }
}

export const api = {
  get: async (url: string) => {
    console.debug(`[API GET] ${API_BASE_URL}${url}`);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      handleAuthError(response.status);
      throw { status: response.status, message: response.statusText };
    }

    const data = await response.json();
    return { data };
  },

  post: async (url: string, body: any) => {
    console.debug(`[API POST] ${API_BASE_URL}${url}`, body);

    // Handle admin login locally (mock)
    if (url.includes('login')) {
      if (body.email === 'admin@taaza.com' && body.password === 'admin123') {
        const token = 'mock_jwt_token_' + Date.now();
        const user = { name: 'Super Admin', email: body.email, role: 'Admin' };
        // For local mock, store user info but do not store sensitive token in localStorage
        storage.set('taaza_user', JSON.stringify(user));
        return { data: { token, user } };
      }
      throw { status: 401, message: 'Invalid credentials' };
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      handleAuthError(response.status);
      throw { status: response.status, message: response.statusText };
    }

    const data = await response.json();
    return { data };
  },

  put: async (url: string, body: any) => {
    console.debug(`[API PUT] ${API_BASE_URL}${url}`, body);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      handleAuthError(response.status);
      throw { status: response.status, message: response.statusText };
    }

    const data = await response.json();
    return { data };
  },

  delete: async (url: string) => {
    console.debug(`[API DELETE] ${API_BASE_URL}${url}`);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      handleAuthError(response.status);
      throw { status: response.status, message: response.statusText };
    }

    const data = await response.json();
    return { data };
  }
};
