import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../hooks/useCart';
import { createPaymentIntent, checkout } from '../services/cartService';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'
);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setProcessing(true);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout`,
      },
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <PaymentElement />
      {error && <p className="cart-error">{error}</p>}
      <button type="submit" disabled={!stripe || processing} className="cart-checkout-btn">
        {processing ? 'Processing...' : 'Pay now'}
      </button>
    </form>
  );
}

function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cartItems, refreshCart, loading: cartLoading } = useCart();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    if (paymentIntentId && redirectStatus === 'succeeded') {
      checkout(paymentIntentId)
        .then(() => {
          refreshCart();
          navigate('/orders');
        })
        .catch((err) => setError(err.message || 'Failed to complete order'))
        .finally(() => setLoading(false));
      return;
    }

    if (cartItems.length === 0 && !cartLoading) {
      setLoading(false);
      return;
    }

    if (cartItems.length > 0) {
      createPaymentIntent()
        .then(setClientSecret)
        .catch((err) => {
          if (err.message?.includes('Stripe not configured')) {
            setClientSecret('dev-mode');
          } else {
            setError(err.message || 'Failed to initialize payment');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [paymentIntentId, redirectStatus, cartItems.length, cartLoading, navigate, refreshCart]);

  if (cartLoading || (loading && !paymentIntentId)) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (cartItems.length === 0 && !paymentIntentId) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p className="cart-empty">Your cart is empty.</p>
        <Link to="/products">Browse Products</Link>
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <p className="cart-error">{error}</p>
        <Link to="/cart">Back to Cart</Link>
      </div>
    );
  }

  const total = cartItems.reduce(
    (sum, { product, quantity }) => sum + (product.price ?? 0) * quantity,
    0
  );

  const handleDevCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      await checkout();
      refreshCart();
      navigate('/orders');
    } catch (err) {
      setError(err.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>
      <div className="checkout-summary">
        <h2>Order Summary</h2>
        <ul className="checkout-items">
          {cartItems.map(({ product, quantity }) => (
            <li key={product.id} className="checkout-item">
              <span>{product.name}</span>
              <span>× {quantity}</span>
              <span>${((product.price ?? 0) * quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
        <p className="checkout-total">Total: ${total.toFixed(2)}</p>
      </div>

      {clientSecret === 'dev-mode' ? (
        <div className="checkout-payment">
          <p className="checkout-dev-notice">
            Stripe is not configured. Set STRIPE_SECRET_KEY and VITE_STRIPE_PUBLISHABLE_KEY to enable payments.
          </p>
          {error && <p className="cart-error">{error}</p>}
          <button
            type="button"
            onClick={handleDevCheckout}
            disabled={loading}
            className="cart-checkout-btn"
          >
            {loading ? 'Processing...' : 'Complete order (dev mode)'}
          </button>
        </div>
      ) : (
        clientSecret && (
          <div className="checkout-payment">
            <h2>Payment</h2>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                },
              }}
            >
              <CheckoutForm />
            </Elements>
          </div>
        )
      )}

      <Link to="/cart" className="checkout-back">
        ← Back to Cart
      </Link>
    </div>
  );
}

export default Checkout;
