import Product from './Product';

function ProductList({ products }) {
  if (!products?.length) {
    return (
      <p className="product-list-empty">No products available.</p>
    );
  }

  return (
    <ul className="product-list">
      {products.map((product) => (
        <li key={product.id} className="product-list-item">
          <Product product={product} />
        </li>
      ))}
    </ul>
  );
}

export default ProductList;
