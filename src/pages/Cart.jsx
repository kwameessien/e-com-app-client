import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';

function Cart() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

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
      <Link to="/checkout" className="cart-checkout-btn">
        Proceed to Checkout
      </Link>
    </div>
  );
}

export default Cart;
