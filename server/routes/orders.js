import { Router } from 'express';
import { stripe } from './payments.js';
import { requireAuth } from '../middleware/auth.js';

// In-memory orders (use a database in production)
const orders = [];

/**
 * Orders API - past orders (order history).
 * Distinct from current cart. Orders are created on checkout after payment.
 */
export function createOrdersRoutes() {
  const router = Router();
  router.use(requireAuth);

  // Get order history for current user
  router.get('/', (req, res) => {
    const userOrders = orders.filter((o) => o.userId === req.session.user.id);
    res.json({ orders: userOrders });
  });

  // Get single order (only user's own orders)
  router.get('/:id', (req, res) => {
    const order = orders.find(
      (o) => o.id === req.params.id && o.userId === req.session.user.id
    );
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  });

  // Create order (checkout) - verifies Stripe payment, then moves cart to order
  router.post('/', async (req, res) => {
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
      status: 'completed',
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