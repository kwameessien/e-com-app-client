import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../services/cartService';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((err) => setError(err.message || 'Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="order-history">
        <h1>Order History</h1>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history">
        <h1>Order History</h1>
        <p className="product-error">{error}</p>
        <Link to="/">Back to Home</Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history">
        <h1>Order History</h1>
        <p className="cart-empty">You have no past orders.</p>
        <Link to="/products">Browse Products</Link>
      </div>
    );
  }

  return (
    <div className="order-history">
      <h1>Order History</h1>
      <p className="order-history-intro">
        Past orders (distinct from your current cart).
      </p>
      <ul className="order-list">
        {orders.map((order) => (
          <li key={order.id} className="order-item">
            <div className="order-header">
              <span className="order-id">Order {order.id.slice(0, 8)}</span>
              <span className="order-date">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            <ul className="order-items">
              {order.items.map(({ product, quantity }) => (
                <li key={product.id} className="order-line-item">
                  <Link to={`/products/${product.id}`}>{product.name}</Link>
                  <span>× {quantity}</span>
                  <span>${((product.price ?? 0) * quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <p className="order-total">
              Total: $
              {order.items
                .reduce(
                  (sum, { product, quantity }) => sum + (product.price ?? 0) * quantity,
                  0
                )
                .toFixed(2)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default OrderHistory;
