import { Link } from 'react-router-dom';

function Product({ product }) {
  const { id, name, description, image } = product;

  return (
    <Link to={`/products/${id}`} className="product-card-link">
      <article className="product-card">
        <div className="product-image">
          <img src={image} alt={name} />
        </div>
        <div className="product-info">
          <h3 className="product-name">{name}</h3>
          <p className="product-description">{description}</p>
        </div>
      </article>
    </Link>
  );
}

export default Product;
