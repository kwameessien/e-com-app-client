import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { checkout } from '../services/cartService';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, refreshCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  const handleCheckout = async () => {
    setCheckoutError(null);
    setCheckingOut(true);
    try {
      await checkout();
      refreshCart();
      navigate('/orders');
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  if (cartItems.length === 0 && !checkingOut) {
    return (
      <div className="cart-page">
        <h1>Shopping Cart</h1>
        <p className="cart-empty">Your cart is empty.</p>
        <Link to="/products">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Shopping Cart</h1>
      <ul className="cart-list">
        {cartItems.map(({ product, quantity }) => (
          <li key={product.id} className="cart-item">
            <Link to={`/products/${product.id}`} className="cart-item-image">
              <img src={product.image} alt={product.name} />
            </Link>
            <div className="cart-item-info">
              <Link to={`/products/${product.id}`} className="cart-item-name">
                {product.name}
              </Link>
              <div className="cart-item-actions">
                <label>
                  Qty:
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) =>
                      updateQuantity(product.id, parseInt(e.target.value, 10) || 1)
                    }
                    className="cart-item-qty"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeFromCart(product.id)}
                  className="cart-item-remove"
                >
                  Remove
                </button>
              </div>
            </div>
            <span className="cart-item-price">
              ${((product.price ?? 0) * quantity).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
      <p className="cart-total">
        Total: $
        {cartItems
          .reduce((sum, { product, quantity }) => sum + (product.price ?? 0) * quantity, 0)
          .toFixed(2)}
      </p>
      {checkoutError && <p className="cart-error">{checkoutError}</p>}
      <button
        type="button"
        onClick={handleCheckout}
        disabled={checkingOut}
        className="cart-checkout-btn"
      >
        {checkingOut ? 'Processing...' : 'Checkout'}
      </button>
    </div>
  );
}

export default Cart;
