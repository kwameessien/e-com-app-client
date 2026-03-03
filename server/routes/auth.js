import { Router } from 'express';
import passport from 'passport';

/**
 * OAuth routes for third-party login (Google, Facebook).
 * Uses Passport.js strategies configured in config/passport.js.
 */
export function createAuthRoutes({ frontendUrl, tokenStore }) {
  const router = Router();

  const createTokenAndRedirect = (req, res) => {
    if (!req.user) {
      return res.redirect(`${frontendUrl}/login?error=Authentication+failed`);
    }
    const token = crypto.randomUUID();
    tokenStore.set(token, req.user);
    setTimeout(() => tokenStore.delete(token), 5 * 60 * 1000); // 5 min expiry
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
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
      createTokenAndRedirect
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
      createTokenAndRedirect
    );
  } else {
    router.get('/facebook', (_req, res) =>
      res.redirect(`${frontendUrl}/login?error=Facebook+OAuth+not+configured`)
    );
  }

  // Exchange one-time token for user (used after OAuth redirect to frontend)
  router.get('/session', (req, res) => {
    const token = req.query.token;
    if (!token) return res.status(400).json({ message: 'Token required' });

    const user = tokenStore.get(token);
    tokenStore.delete(token);
    if (!user) return res.status(401).json({ message: 'Invalid or expired token' });

    res.json({
      user: {
        id: user.id,
        username: user.username,
      },
    });
  });

  return router;
}
