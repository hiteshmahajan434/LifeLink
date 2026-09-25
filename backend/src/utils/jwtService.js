import jwt from 'jsonwebtoken';

/**
 * Signs a JWT token with the given payload.
 * Payload includes id (e.g. AMB-100) and role (AMBULANCE / HOSPITAL).
 * @param {object} payload
 * @returns {string} token
 */
// Creates a jwt token
export const signToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verifies a JWT token.
 * @param {string} token
 * @returns {object} decoded payload
 */
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.verify(token, secret);
};
