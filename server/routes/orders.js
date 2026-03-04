import { Router } from 'express';
import { stripe } from './payments.js';

// In-memory orders (use a database in production)
const orders = [];

/**
 * Orders API - past orders (order history).
 * Distinct from current cart. Orders are created on checkout after payment.
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

  // Create order (checkout) - verifies Stripe payment, then moves cart to order
  router.post('/', async (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const cart = req.session.cart || [];
    if (cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const { paymentIntentId } = req.body;

    if (stripe && paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ message: 'Payment not completed' });
        }
        if (paymentIntent.metadata?.userId !== req.session.user.id) {
          return res.status(403).json({ message: 'Payment does not match user' });
        }
      } catch (err) {
        console.error('Stripe verify error:', err);
        return res.status(400).json({ message: 'Invalid payment' });
      }
    } else if (stripe) {
      return res.status(400).json({ message: 'Payment required' });
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
