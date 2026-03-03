import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';

/**
 * Configure Passport.js strategies for third-party authentication.
 * @param {Object} options - Configuration options
 * @param {Function} options.findOrCreateOAuthUser - (provider, profile) => user
 * @param {string} options.apiUrl - Base URL for OAuth callbacks (e.g. http://localhost:3001)
 */
export function configurePassport({ findOrCreateOAuthUser, apiUrl }) {
  // Google OAuth 2.0
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${apiUrl}/api/auth/google/callback`,
        },
        (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = findOrCreateOAuthUser('google', profile);
            done(null, user);
          } catch (err) {
            done(err, null);
          }
        }
      )
    );
  }

  // Facebook Login
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: `${apiUrl}/api/auth/facebook/callback`,
          profileFields: ['id', 'emails', 'name', 'displayName'],
        },
        (_accessToken, _refreshToken, profile, done) => {
          try {
            const user = findOrCreateOAuthUser('facebook', profile);
            done(null, user);
          } catch (err) {
            done(err, null);
          }
        }
      )
    );
  }

  return passport;
}
