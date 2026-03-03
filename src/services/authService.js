export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fetchOptions = { credentials: 'include' };

export async function register(username, password) {
  const response = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

export async function login(username, password) {
  const response = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

export async function getOAuthSession(token) {
  const response = await fetch(
    `${API_BASE}/api/auth/session?token=${encodeURIComponent(token)}`,
    fetchOptions
  );

  if (!response.ok) {
    throw new Error('Session exchange failed');
  }

  return response.json();
}

export async function getMe() {
  const response = await fetch(`${API_BASE}/api/auth/me`, fetchOptions);

  if (!response.ok) {
    if (response.status === 401) return null;
    throw new Error('Failed to get session');
  }

  const data = await response.json();
  return data.user;
}

export async function logout() {
  const response = await fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    ...fetchOptions,
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}
