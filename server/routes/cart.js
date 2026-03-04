import { Router } from 'express';

/**
 * Cart API - current active cart stored in session.
 * Distinct from past orders (order history).
 */
export function createCartRoutes({ products }) {
  const router = Router();

  const ensureCart = (req) => {
    if (!req.session.cart) {
      req.session.cart = [];
    }
    return req.session.cart;
  };

  // Get current cart (checkout page)
  router.get('/', (req, res) => {
    const cart = ensureCart(req);
    res.json({ items: cart });
  });

  // Add item to cart
  router.post('/', (req, res) => {
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const product = products.find((p) => p.id === productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const cart = ensureCart(req);
    const existing = cart.find((item) => item.product.id === productId);
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ product: { ...product }, quantity: qty });
    }

    res.json({ items: cart });
  });

  // Update item quantity
  router.put('/:productId', (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (qty <= 0) {
      const cart = ensureCart(req);
      const idx = cart.findIndex((item) => item.product.id === productId);
      if (idx !== -1) {
        cart.splice(idx, 1);
      }
      return res.json({ items: req.session.cart });
    }

    const cart = ensureCart(req);
    const item = cart.find((i) => i.product.id === productId);
    if (!item) {
      return res.status(404).json({ message: 'Item not in cart' });
    }
    item.quantity = qty;
    res.json({ items: cart });
  });

  // Remove item from cart
  router.delete('/:productId', (req, res) => {
    const cart = ensureCart(req);
    const idx = cart.findIndex((item) => item.product.id === req.params.productId);
    if (idx !== -1) {
      cart.splice(idx, 1);
    }
    res.json({ items: cart });
  });

  return router;
}
