import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

/**
 * Generate a JWT token with userId and role payload
 * @param {Object} payload - { userId, role }
 * @returns {string} JWT token
 */
export const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {Object} decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};
