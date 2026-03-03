import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getOAuthSession } from '../services/authService';

function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [asyncError, setAsyncError] = useState(null);
  const token = searchParams.get('token');
  const tokenError = !token ? 'Invalid callback' : null;
  const error = tokenError || asyncError;

  useEffect(() => {
    if (!token) return;
    getOAuthSession(token)
      .then((data) => {
        login(data.user);
        navigate('/', { replace: true });
        window.history.replaceState({}, '', '/');
      })
      .catch(() => {
        setAsyncError('Failed to complete sign in');
      });
  }, [token, login, navigate]);

  if (error) {
    return (
      <div className="auth-page">
        <p className="auth-error">{error}</p>
        <Link to="/login">Back to Login</Link>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <p>Completing sign in...</p>
    </div>
  );
}

export default AuthCallback;
