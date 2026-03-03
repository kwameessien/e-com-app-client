import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { configurePassport } from './config/passport.js';
import { createAuthRoutes } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);
app.use(passport.initialize());

// In-memory store for demo (use a database in production)
const users = new Map();
const usersByProvider = new Map(); // "google:id" or "facebook:id" -> user
const tokenStore = new Map(); // one-time token -> user (expires after use)

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

// Configure Passport.js strategies for third-party login
configurePassport({
  findOrCreateOAuthUser,
  apiUrl: API_URL,
});

// Mount OAuth routes
app.use('/api/auth', createAuthRoutes({ frontendUrl: FRONTEND_URL, tokenStore }));

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (users.has(username)) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = {
      id: crypto.randomUUID(),
      username,
      passwordHash: hashedPassword,
    };
    users.set(username, user);

    req.session.user = { id: user.id, username: user.username };
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

// Login (username/password)
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

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    req.session.user = { id: user.id, username: user.username };
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!process.env.GOOGLE_CLIENT_ID && !process.env.FACEBOOK_APP_ID) {
    console.log('Tip: Set GOOGLE_CLIENT_ID or FACEBOOK_APP_ID in .env to enable third-party login');
  }
});
