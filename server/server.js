import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { configurePassport } from './config/passport.js';
import { createAuthRoutes } from './routes/auth.js';
import { createCartRoutes } from './routes/cart.js';
import { createOrdersRoutes } from './routes/orders.js';
import { createPaymentsRoutes } from './routes/payments.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

// Trust proxy so req.secure is correct when behind HTTPS-terminating proxy
app.set('trust proxy', 1);

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

// Sample products (use a database in production)
const products = [
  {
    id: '1',
    name: 'Classic Cotton T-Shirt',
    description: 'A comfortable, breathable cotton t-shirt perfect for everyday wear. Available in multiple colors. Made from 100% organic cotton with a relaxed fit.',
    image: 'https://picsum.photos/seed/shirt1/400/400',
    price: 24.99,
  },
  {
    id: '2',
    name: 'Wireless Headphones',
    description: 'Premium noise-canceling wireless headphones with 30-hour battery life and crystal-clear sound. Features Bluetooth 5.0 and a foldable design.',
    image: 'https://picsum.photos/seed/headphones2/400/400',
    price: 149.99,
  },
  {
    id: '3',
    name: 'Leather Messenger Bag',
    description: 'Handcrafted leather bag with multiple compartments. Ideal for work or travel. Full-grain leather with brass hardware.',
    image: 'https://picsum.photos/seed/bag3/400/400',
    price: 189.99,
  },
  {
    id: '4',
    name: 'Stainless Steel Water Bottle',
    description: 'Keep your drinks cold for 24 hours or hot for 12. BPA-free and eco-friendly. 32oz capacity with leak-proof lid.',
    image: 'https://picsum.photos/seed/bottle4/400/400',
    price: 34.99,
  },
  {
    id: '5',
    name: 'Running Shoes',
    description: 'Lightweight, cushioned running shoes designed for comfort and performance on any terrain. Breathable mesh upper with responsive midsole.',
    image: 'https://picsum.photos/seed/shoes5/400/400',
    price: 119.99,
  },
];

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

// Cart API (current active cart - session-based)
app.use('/api/cart', createCartRoutes({ products }));

// Orders API (past orders - order history)
app.use('/api/orders', createOrdersRoutes());

// Payments API (Stripe)
app.use('/api/payments', createPaymentsRoutes());

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

// Products API
app.get('/api/products', (_req, res) => {
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.json(product);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  if (!process.env.GOOGLE_CLIENT_ID && !process.env.FACEBOOK_APP_ID) {
    console.log('Tip: Set GOOGLE_CLIENT_ID or FACEBOOK_APP_ID in .env to enable third-party login');
  }
});
