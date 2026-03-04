import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';

function Header() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();

  return (
    <header>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/products">Products</Link>
        <Link to="/cart" className="nav-cart">
          Cart
          {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
        </Link>
        {user ? (
          <>
            <span className="nav-user">Hello, {user.username}</span>
            <button type="button" onClick={logout} className="nav-logout">
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/register">Register</Link>
            <Link to="/login">Log In</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
