import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const [error, setError] = useState(null);

  const handleRemove = async (productId) => {
    setError(null);
    try {
      await removeFromCart(productId);
    } catch (err) {
      if (err.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent('/cart')}`, {
          replace: true,
        });
      } else {
        setError(err.message || 'Failed to remove item');
      }
    }
  };

  const handleQuantityChange = async (productId, quantity) => {
    setError(null);
    try {
      await updateQuantity(productId, quantity);
    } catch (err) {
      if (err.status === 401) {
        navigate(`/login?redirect=${encodeURIComponent('/cart')}`, {
          replace: true,
        });
      } else {
        setError(err.message || 'Failed to update quantity');
      }
    }
  };

  if (cartItems.length === 0) {
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
      {error && <p className="cart-error">{error}</p>}
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
                      handleQuantityChange(
                        product.id,
                        parseInt(e.target.value, 10) || 1
                      )
                    }
                    className="cart-item-qty"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => handleRemove(product.id)}
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
      <Link to="/checkout" className="cart-checkout-btn">
        Proceed to Checkout
      </Link>
    </div>
  );
}

export default Cart;
