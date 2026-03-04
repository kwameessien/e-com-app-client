import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../services/productService';
import { useCart } from '../hooks/useCart';

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product);
    setAdded(true);
  };

  if (loading) {
    return (
      <div className="product-detail">
        <p>Loading product...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail">
        <p className="product-error">{error || 'Product not found'}</p>
        <Link to="/products">Back to Products</Link>
      </div>
    );
  }

  const { name, description, image, price } = product;

  return (
    <div className="product-detail">
      <Link to="/products" className="product-detail-back">
        ← Back to Products
      </Link>
      <div className="product-detail-grid">
        <div className="product-detail-image">
          <img src={image} alt={name} />
        </div>
        <div className="product-detail-info">
          <h1 className="product-detail-name">{name}</h1>
          {price != null && (
            <p className="product-detail-price">
              ${typeof price === 'number' ? price.toFixed(2) : price}
            </p>
          )}
          <p className="product-detail-description">{description}</p>
          <button
            type="button"
            onClick={handleAddToCart}
            className="product-detail-add-btn"
            disabled={added}
          >
            {added ? 'Added to Cart' : 'Add to Cart'}
          </button>
          {added && (
            <Link to="/cart" className="product-detail-cart-link">
              View Cart
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
