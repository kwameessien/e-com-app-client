/**
 * Authentication middleware.
 * Requires req.session.user. Returns 401 Unauthorized if not authenticated.
 */
export function requireAuth(req, res, next) {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
}
