
const express = require('express');
const router = express.Router();
const db = require('../db');
const { hashPassword, verifyPassword } = require('../auth'); // Import the hashing and verification functions
const jwt = require('jsonwebtoken'); // Import JWT for generating tokens
const logger = require('../logger'); // Logger for handling application-level logging (info, warn, error)

// Secret key for JWT (should be stored in an environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; // Replace with a secure key

// User Registration
router.post('/register', async (req, res) => {
    const { username, password, role, phone_number, email } = req.body;

    // Validate inputs
    if (!username || !password || password.length < 6) {
        logger.warn('Invalid registration attempt: %s', JSON.stringify(req.body));
        return res.status(400).send('Username and password are required. Password must be at least 6 characters.');
    }

    try {
        const hashedPassword = await hashPassword(password);

        const sql = 'INSERT INTO users (username, hashed_password, role, phone_number, email) VALUES (?, ?, ?, ?, ?)';
        await db.query(sql, [username, hashedPassword, role, phone_number, email]);
        
        logger.info('User registered successfully: %s', username);
        res.status(201).send('User registered successfully');
    } catch (error) {
        logger.error('Error during registration: %s', error);
        res.status(500).send('Internal server error');
    }
});

// User Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate inputs
    if (!username || !password) {
        logger.warn('Invalid login attempt: %s', JSON.stringify(req.body));
        return res.status(400).send('Username and password are required.');
    }

    try {
        const sql = 'SELECT * FROM users WHERE username = ?';
        const [results] = await db.query(sql, [username]);

        if (results.length === 0) {
            logger.warn('Login failed: Invalid username %s', username);
            return res.status(400).send('Invalid username or password.');
        }

        const user = results[0];

        // Verify the password
        const isValid = await verifyPassword(user.hashed_password, password);
        if (!isValid) {
            logger.warn('Login failed: Invalid password for username %s', username);
            return res.status(400).send('Invalid username or password.');
        }

        // Check if the user is active
        if (user.is_active === 0) {
            return res.status(403).json({ message: 'User account is deactivated' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        logger.info('User logged in successfully: %s', username);
        res.status(200).json({ token }); // Send the token to the client
    } catch (error) {
        logger.error('Error during login: %s', error);
        res.status(500).send('Internal server error');
    }
});

// Middleware to protect routes
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer token

    if (!token) {
        logger.warn('Authentication failed: No token provided');
        return res.sendStatus(403); // Forbidden
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Authentication failed: Invalid token');
            return res.sendStatus(403); // Forbidden
        }
        req.user = user; // Save user info in request
        next();
    });
};

module.exports = {
    router,
    authenticateJWT // Export the authentication middleware
};

