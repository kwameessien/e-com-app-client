import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Wraps content that requires authentication.
 * Redirects to login with return URL if user is not signed in.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      const returnUrl = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`, {
        replace: true,
      });
    }
  }, [loading, user, navigate, location.pathname, location.search]);

  if (loading) {
    return (
      <div className="checkout-page">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}

export default ProtectedRoute;
