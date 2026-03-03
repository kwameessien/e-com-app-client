import { Router } from 'express';
import passport from 'passport';

/**
 * OAuth routes for third-party login (Google, Facebook).
 * Uses Passport.js strategies configured in config/passport.js.
 * Establishes session on successful authentication.
 */
export function createAuthRoutes({ frontendUrl, tokenStore }) {
  const router = Router();

  const createSessionAndRedirect = (req, res) => {
    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=Authentication+failed`);
    }
    req.session.user = { id: req.user.id, username: req.user.username };
    res.redirect(`${frontendUrl}/auth/callback`);
  };

  // Google OAuth
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    router.get(
      '/google/callback',
      passport.authenticate('google', {
        session: false,
        failureRedirect: `${frontendUrl}/login?error=Google+sign-in+failed`,
      }),
      createSessionAndRedirect
    );
  } else {
    router.get('/google', (_req, res) =>
      res.redirect(`${frontendUrl}/login?error=Google+OAuth+not+configured`)
    );
  }

  // Facebook OAuth
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

    router.get(
      '/facebook/callback',
      passport.authenticate('facebook', {
        session: false,
        failureRedirect: `${frontendUrl}/login?error=Facebook+sign-in+failed`,
      }),
      createSessionAndRedirect
    );
  } else {
    router.get('/facebook', (_req, res) =>
      res.redirect(`${frontendUrl}/login?error=Facebook+OAuth+not+configured`)
    );
  }

  // Get current user from session
  router.get('/me', (req, res) => {
    if (!req.session?.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
  });

  // Logout - destroy session
  router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.clearCookie('connect.sid', { path: '/' });
      res.json({ success: true });
    });
  });

  // Exchange one-time token for user (fallback for OAuth when session cookie not sent)
  router.get('/session', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const user = tokenStore.get(token);
    tokenStore.delete(token);
    if (!user) return res.status(401).json({ message: 'Invalid or expired token' });

    req.session.user = { id: user.id, username: user.username };
    res.json({
      user: {
        id: user.id,
        username: user.username,
      },
    });
  });

  return router;
}
