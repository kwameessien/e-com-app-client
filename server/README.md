# E-Commerce API Server

REST API with username/password and third-party (Google, Facebook) authentication via Passport.js.

## Third-Party Login Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project or select an existing one
3. Enable the **Google+ API** (or **Google Identity**)
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback` (or your `API_URL` + `/api/auth/google/callback`)
7. Copy the Client ID and Client Secret to your `.env` file

### Facebook Login

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app or select an existing one
3. Add the **Facebook Login** product
4. Under **Facebook Login** → **Settings**, add Valid OAuth Redirect URI: `http://localhost:3001/api/auth/facebook/callback`
5. Copy the App ID and App Secret to your `.env` file

### Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

## Running the Server

```bash
npm run dev   # Development with auto-reload
npm start     # Production
```
