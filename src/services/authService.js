export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function register(username, password) {
  const response = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
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
  const response = await fetch(`${API_BASE}/api/auth/session?token=${encodeURIComponent(token)}`);

  if (!response.ok) {
    throw new Error('Session exchange failed');
  }

  return response.json();
}
