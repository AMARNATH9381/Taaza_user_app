
// Real API implementation connecting to auth-service backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Simulated persistent storage for the session
const storage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, val: string) => localStorage.setItem(key, val),
  remove: (key: string) => localStorage.removeItem(key)
};

export const api = {
  get: async (url: string) => {
    console.debug(`[API GET] ${API_BASE_URL}${url}`);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.get('taaza_token') || ''}`
      }
    });

    if (!response.ok) {
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
        storage.set('taaza_token', token);
        storage.set('taaza_user', JSON.stringify(user));
        return { data: { token, user } };
      }
      throw { status: 401, message: 'Invalid credentials' };
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.get('taaza_token') || ''}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw { status: response.status, message: response.statusText };
    }

    const data = await response.json();
    return { data };
  },

  put: async (url: string, body: any) => {
    console.debug(`[API PUT] ${API_BASE_URL}${url}`, body);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.get('taaza_token') || ''}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw { status: response.status, message: response.statusText };
    }

    const data = await response.json();
    return { data };
  },

  delete: async (url: string) => {
    console.debug(`[API DELETE] ${API_BASE_URL}${url}`);

    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${storage.get('taaza_token') || ''}`
      }
    });

    if (!response.ok) {
      throw { status: response.status, message: response.statusText };
    }

    const data = await response.json();
    return { data };
  }
};
