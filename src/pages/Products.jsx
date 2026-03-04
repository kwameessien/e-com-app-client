import { useState, useEffect } from 'react';
import { getProducts } from '../services/productService';
import ProductList from '../components/ProductList';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch((err) => setError(err.message || 'Failed to load products'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="products-page">
        <h1>Products</h1>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="products-page">
        <h1>Products</h1>
        <p className="product-error">{error}</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      <h1>Products</h1>
      <ProductList products={products} />
    </div>
  );
}

export default Products;
