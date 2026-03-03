import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getMe } from '../services/authService';

function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [asyncError, setAsyncError] = useState(null);

  useEffect(() => {
    getMe()
      .then((userData) => {
        if (userData) {
          login(userData);
          navigate('/', { replace: true });
          window.history.replaceState({}, '', '/');
        } else {
          setAsyncError('Invalid callback');
        }
      })
      .catch(() => setAsyncError('Failed to complete sign in'));
  }, [login, navigate]);

  if (asyncError) {
    return (
      <div className="auth-page">
        <p className="auth-error">{asyncError}</p>
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
