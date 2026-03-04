import { Router } from 'express';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Create a PaymentIntent for the current cart total.
 * Returns clientSecret for Stripe Elements.
 */
export function createPaymentsRoutes() {
  const router = Router();

  router.post('/create-payment-intent', async (req, res) => {
    if (!stripe) {
      return res.status(503).json({
        message: 'Stripe not configured. Set STRIPE_SECRET_KEY in .env',
      });
    }

    if (!req.session?.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const cart = req.session.cart || [];
    if (cart.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const amountCents = Math.round(
      cart.reduce(
        (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
        0
      ) * 100
    );

    if (amountCents < 50) {
      return res.status(400).json({ message: 'Minimum charge is $0.50' });
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          userId: req.session.user.id,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
      console.error('Stripe error:', err);
      res.status(500).json({ message: err.message || 'Failed to create payment intent' });
    }
  });

  return router;
}

export { stripe };
