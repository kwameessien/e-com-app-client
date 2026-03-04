const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const fetchOptions = { credentials: 'include' };

export async function getCart() {
  const response = await fetch(`${API_BASE}/api/cart`, fetchOptions);

  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    throw new Error('Failed to fetch cart');
  }

  const data = await response.json();
  return data.items;
}

export async function addToCart(productId, quantity = 1) {
  const response = await fetch(`${API_BASE}/api/cart`, {
    method: 'POST',
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || 'Failed to add to cart');
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.items;
}

export async function updateCartItem(productId, quantity) {
  const response = await fetch(`${API_BASE}/api/cart/${productId}`, {
    method: 'PUT',
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || 'Failed to update cart');
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.items;
}

export async function removeFromCart(productId) {
  const response = await fetch(`${API_BASE}/api/cart/${productId}`, {
    method: 'DELETE',
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || 'Failed to remove from cart');
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.items;
}

export async function createPaymentIntent() {
  const response = await fetch(`${API_BASE}/api/payments/create-payment-intent`, {
    method: 'POST',
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || 'Failed to create payment');
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data.clientSecret;
}

export async function checkout(paymentIntentId) {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentIntentId: paymentIntentId || undefined }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const err = new Error(error.message || 'Checkout failed');
    err.status = response.status;
    throw err;
  }

  return response.json();
}

export async function getOrders() {
  const response = await fetch(`${API_BASE}/api/orders`, fetchOptions);

  if (!response.ok) {
    if (response.status === 401) return [];
    throw new Error('Failed to fetch orders');
  }

  const data = await response.json();
  return data.orders;
}
