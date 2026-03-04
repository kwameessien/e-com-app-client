import { Router } from 'express';

// In-memory orders (use a database in production)
const orders = [];

/**
 * Orders API - past orders (order history).
 * Distinct from current cart. Orders are created on checkout.
 */
export function createOrdersRoutes() {
  const router = Router();

  // Get order history for current user
  router.get('/', (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const userOrders = orders.filter((o) => o.userId === req.session.user.id);
    res.json({ orders: userOrders });
  });

  // Create order (checkout) - moves cart to order, clears cart
  router.post('/', (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const cart = req.session.cart || [];
    if (cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const order = {
      id: crypto.randomUUID(),
      userId: req.session.user.id,
      items: cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })),
      createdAt: new Date().toISOString(),
    };
    orders.push(order);
    req.session.cart = [];

    res.status(201).json({ order });
  });

  return router;
}
