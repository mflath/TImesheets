const argon2 = require('argon2');
const db = require('./db'); // Ensure you have access to your database connection
const logger = require('./logger'); // Import the logger for logging events

/**
 * Hash a password using Argon2.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - The hashed password.
 */
async function hashPassword(password) {
    try {
        const hashedPassword = await argon2.hash(password);
        logger.info('Hashed Password created successfully'); // Log info on successful hashing
        return hashedPassword;
    } catch (err) {
        logger.error('Error hashing password: %s', err); // Log error if hashing fails
        throw err; // Rethrow the error for handling elsewhere
    }
}

/**
 * Verify a password against a hashed password.
 * @param {string} hashedPassword - The hashed password.
 * @param {string} password - The password to verify.
 * @returns {Promise<boolean>} - True if the password is valid, false otherwise.
 */
async function verifyPassword(hashedPassword, password) {
    try {
        const isValid = await argon2.verify(hashedPassword, password);
        logger.info('Password valid: %s', isValid); // Log info on password verification
        return isValid;
    } catch (err) {
        logger.error('Error verifying password: %s', err); // Log error if verification fails
        throw err; // Rethrow the error for handling elsewhere
    }
}

/**
 * Register a new user in the database.
 * @param {string} username - The username for the new user.
 * @param {string} password - The password for the new user.
 * @returns {Promise<Object>} - The result of the registration.
 */
async function registerUser(username, password) {
    try {
        // Hash the password
        const hashedPassword = await hashPassword(password);

        // Insert user into the database
        const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
        await db.query(sql, [username, hashedPassword]);

        logger.info('User registered successfully: %s', username); // Log info on successful registration
        return { success: true };
    } catch (err) {
        logger.error('Error registering user: %s', err); // Log error if registration fails
        return { success: false, message: 'Registration failed' };
    }
}

// Exporting functions for use in other modules
module.exports = {
    hashPassword,
    verifyPassword,
    registerUser // Export registerUser function
};

// Example usage (can be commented out or removed when not needed)
if (require.main === module) {
    (async () => {
        const username = 'newUser';
        const password = 'mySecurePassword123';
        const result = await registerUser(username, password);
        logger.info('Registration result: %s', JSON.stringify(result)); // Log the result of registration
    })();
}
