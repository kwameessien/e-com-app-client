function Product({ product }) {
  const { name, description, image } = product;

  return (
    <article className="product-card">
      <div className="product-image">
        <img src={image} alt={name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        <p className="product-description">{description}</p>
      </div>
    </article>
  );
}

export default Product;
