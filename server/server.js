import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// In-memory store for demo (use a database in production)
const users = new Map();
const usersByProvider = new Map(); // "google:id" or "facebook:id" -> user
const tokenStore = new Map(); // one-time token -> user (expires after use)

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (users.has(username)) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash and salt the password (10 rounds is a good default)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = {
      id: crypto.randomUUID(),
      username,
      passwordHash: hashedPassword,
    };
    users.set(username, user);

    // Return user without password for auto sign-in
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = users.get(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // bcrypt.compare hashes the incoming password and compares to stored hash
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// OAuth: find or create user from provider profile
function findOrCreateOAuthUser(provider, profile) {
  const providerKey = `${provider}:${profile.id}`;
  let user = usersByProvider.get(providerKey);
  if (user) return user;

  const username = profile.emails?.[0]?.value || `${provider}_${profile.id}`;
  user = users.get(username) || {
    id: crypto.randomUUID(),
    username,
    provider,
  };
  users.set(username, user);
  usersByProvider.set(providerKey, user);
  return user;
}

// Google OAuth (requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.API_URL || `http://localhost:${PORT}`}/api/auth/google/callback`,
      },
      (_accessToken, _refreshToken, profile, done) => {
        const user = findOrCreateOAuthUser('google', profile);
        done(null, user);
      }
    )
  );

  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  app.get(
    '/api/auth/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
      const token = crypto.randomUUID();
      tokenStore.set(token, req.user);
      setTimeout(() => tokenStore.delete(token), 5 * 60 * 1000); // 5 min expiry
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    }
  );
} else {
  app.get('/api/auth/google', (_req, res) =>
    res.redirect(`${FRONTEND_URL}/login?error=Google+OAuth+not+configured`)
  );
}

// Facebook OAuth (requires FACEBOOK_APP_ID and FACEBOOK_APP_SECRET)
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.API_URL || `http://localhost:${PORT}`}/api/auth/facebook/callback`,
        profileFields: ['id', 'emails', 'name'],
      },
      (_accessToken, _refreshToken, profile, done) => {
        const user = findOrCreateOAuthUser('facebook', profile);
        done(null, user);
      }
    )
  );

  app.get('/api/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

  app.get(
    '/api/auth/facebook/callback',
    passport.authenticate('facebook', { session: false }),
    (req, res) => {
      const token = crypto.randomUUID();
      tokenStore.set(token, req.user);
      setTimeout(() => tokenStore.delete(token), 5 * 60 * 1000);
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    }
  );
} else {
  app.get('/api/auth/facebook', (_req, res) =>
    res.redirect(`${FRONTEND_URL}/login?error=Facebook+OAuth+not+configured`)
  );
}

// Exchange one-time token for user (used after OAuth redirect)
app.get('/api/auth/session', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
