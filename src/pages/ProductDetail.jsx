import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getProduct } from '../services/productService';
import { useCart } from '../hooks/useCart';

function ProductDetail() {
  const { id } = useParams();
  const { addToCart, cartItems } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    getProduct(id)
      .then((data) => setProduct(data))
      .catch((err) => setError(err.message || 'Failed to load product'))
      .finally(() => setLoading(false));
  }, [id]);

  const isInCart = cartItems.some((item) => item.product.id === id);

  const handleAddToCart = async () => {
    if (!product || isInCart || adding) return;
    setAdding(true);
    try {
      await addToCart(product);
    } catch {
      // Error handled by caller if needed
    } finally {
      setAdding(false);
    }
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
            disabled={isInCart || adding}
          >
            {adding ? 'Adding...' : isInCart ? 'Added to Cart' : 'Add to Cart'}
          </button>
          {(isInCart || adding) && (
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