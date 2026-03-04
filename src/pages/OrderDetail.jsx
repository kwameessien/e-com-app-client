import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getOrder } from '../services/cartService';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch((err) => {
        if (err.status === 401) {
          navigate(`/login?redirect=${encodeURIComponent(`/orders/${id}`)}`, {
            replace: true,
          });
        } else if (err.status === 404) {
          setError('Order not found');
        } else {
          setError(err.message || 'Failed to load order');
        }
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="order-detail">
        <h1>Order Details</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail">
        <h1>Order Details</h1>
        <p className="product-error">{error || 'Order not found'}</p>
        <Link to="/orders">Back to Order History</Link>
      </div>
    );
  }

  const total = order.items.reduce(
    (sum, { product, quantity }) => sum + (product.price ?? 0) * quantity,
    0
  );

  return (
    <div className="order-detail">
      <Link to="/orders" className="order-detail-back">
        ← Back to Order History
      </Link>
      <h1>Order {order.id.slice(0, 8)}</h1>
      <div className="order-detail-meta">
        <span
          className="order-status"
          data-status={order.status || 'completed'}
        >
          {order.status || 'completed'}
        </span>
        <span className="order-date">
          Placed on {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>
      <h2 className="order-detail-items-title">Items</h2>
      <ul className="order-items">
        {order.items.map(({ product, quantity }) => (
          <li key={product.id} className="order-line-item">
            <Link to={`/products/${product.id}`}>{product.name}</Link>
            <span>× {quantity}</span>
            <span>${((product.price ?? 0) * quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>
      <p className="order-total">Total: ${total.toFixed(2)}</p>
    </div>
  );
}

export default OrderDetail;
