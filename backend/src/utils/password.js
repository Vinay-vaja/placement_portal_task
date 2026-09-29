import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

/**
 * Hash a plaintext password
 * @param {string} plainPassword
 * @returns {Promise<string>} hashed password
 */
export const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

/**
 * Compare a plaintext password with a stored hash
 * @param {string} plainPassword
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};
