const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fetchOptions = { credentials: 'include' };

export async function getProducts() {
  const response = await fetch(`${API_BASE}/api/products`, fetchOptions);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export async function getProduct(id) {
  const response = await fetch(`${API_BASE}/api/products/${id}`, fetchOptions);

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch product');
  }

  return response.json();
}
