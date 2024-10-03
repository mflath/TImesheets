const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure you have the correct path to your db file
const argon2 = require('argon2');
const logger = require('../logger'); // Import the logger for logging events
const authenticateJWT = require('../middleware'); // Import the JWT authentication middleware
const jwt = require('jsonwebtoken'); // Import JWT for generating tokens

// Secret key for JWT (should be stored in an environment variable in production)
const JWT_SECRET = 'your_secret_key'; // Replace with a secure key

// User registration route
router.post('/register', async (req, res) => {
    const { username, password, role } = req.body; // Include role in registration

    // Validate input
    if (!username || !password || !role) {
        logger.warn('Missing required fields for registration');
        return res.status(400).json({ message: 'Username, password, and role are required.' });
    }

    try {
        // Check if the username already exists
        const [existingUser] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'Username already exists.' });
        }

        // Hash the password using Argon2
        const hashedPassword = await argon2.hash(password);

        // Insert the new user into the database
        const [result] = await db.query('INSERT INTO users (username, hashed_password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
        
        logger.info('User registered successfully:', { username, userId: result.insertId });
        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    } catch (error) {
        logger.error('Error registering user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// User login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
        logger.warn('Missing username or password');
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    try {
        const sql = 'SELECT hashed_password, role, is_active FROM users WHERE username = ?';
        const [result] = await db.query(sql, [username]);

        if (result.length === 0) {
            logger.warn('Invalid username or password for user:', { username });
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = result[0];
        const match = await argon2.verify(user.hashed_password, password);

        if (!match) {
            logger.warn('Invalid username or password for user:', { username });
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // Check if the user is active
        if (user.is_active === 0) {
            logger.warn('User account is deactivated:', { username });
            return res.status(403).json({ message: 'User account is deactivated' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
        
        logger.info('User logged in successfully:', { username });
        res.json({ message: 'Login successful', role: user.role, token }); // Return role and token for authorization
    } catch (error) {
        logger.error('Error logging in user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update user password route
router.put('/password/:username', async (req, res) => {
    const { username } = req.params;
    const { newPassword } = req.body; // Assuming you're sending the new password in the request body

    // Validate input
    if (!newPassword) {
        logger.warn('Missing new password for update');
        return res.status(400).json({ message: 'New password is required.' });
    }

    try {
        // Hash the new password using Argon2
        const hashedPassword = await argon2.hash(newPassword);

        // Update the user's password in the database
        const [result] = await db.query('UPDATE users SET hashed_password = ? WHERE username = ?', [hashedPassword, username]);

        if (result.affectedRows > 0) {
            logger.info('User password updated successfully:', { username });
            res.status(200).json({ message: 'User password updated successfully' });
        } else {
            logger.warn('User not found during password update:', { username });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error('Error updating user password:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Get all users
router.get('/', async (req, res) => {
    const sql = 'SELECT id, username, role, is_active, deactivation_date FROM users'; // Include new columns
    try {
        const [result] = await db.query(sql);
        logger.info('Retrieved users successfully');
        res.json(result);
    } catch (err) {
        logger.error('Error retrieving users:', err);
        res.status(500).json({ message: 'Error retrieving users' });
    }
});

// Update user role and username
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { username, role } = req.body;

    const sql = 'UPDATE users SET username = ?, role = ? WHERE id = ?';
    try {
        const [result] = await db.query(sql, [username, role, id]);
        if (result.affectedRows > 0) {
            logger.info('User updated successfully:', { id, username, role });
            res.status(200).json({ message: 'User updated' });
        } else {
            logger.warn('User not found for update:', { id });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        logger.error('Error updating user:', err);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM users WHERE id = ?';
    try {
        const [result] = await db.query(sql, [id]);
        if (result.affectedRows > 0) {
            logger.info('User deleted successfully:', { id });
            res.status(200).json({ message: 'User deleted' });
        } else {
            logger.warn('User not found for deletion:', { id });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        logger.error('Error deleting user:', err);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

// Deactivate user route
router.put('/deactivate/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Update the user's is_active status and set the deactivation date
        const [result] = await db.query(
            'UPDATE users SET is_active = 0, deactivation_date = NOW() WHERE id = ?',
            [id]
        );

        if (result.affectedRows > 0) {
            logger.info('User deactivated successfully:', { id });
            res.status(200).json({ message: 'User deactivated successfully' });
        } else {
            logger.warn('User not found for deactivation:', { id });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error('Error deactivating user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Reactivate user route
router.put('/reactivate/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        // Update the user's is_active status and clear the deactivation date
        const [result] = await db.query(
            'UPDATE users SET is_active = 1, deactivation_date = NULL WHERE id = ?',
            [id]
        );

        if (result.affectedRows > 0) {
            logger.info('User reactivated successfully:', { id });
            res.status(200).json({ message: 'User reactivated successfully' });
        } else {
            logger.warn('User not found for reactivation:', { id });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error('Error reactivating user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Update Profile route
router.put('/profile', authenticateJWT, async (req, res) => {
    const { phone_number, email, notification_preferences } = req.body;
    const username = req.user.username; // Extract the username from the JWT

    // Log the request details
    logger.info('Profile update request received', { username, phone_number, email, notification_preferences });

    try {
        const [result] = await db.query(
            'UPDATE users SET phone_number = ?, email = ?, notification_preferences = ? WHERE username = ?',
            [phone_number, email, JSON.stringify(notification_preferences), username]
        );

        if (result.affectedRows > 0) {
            logger.info('Profile updated successfully for user:', { username });
            res.status(200).json({ message: 'Profile updated successfully' });
        } else {
            logger.warn('User not found during profile update:', { username });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Error updating user' });
    }
});

// Toggle Two-Factor Authentication route
router.put('/two-factor', authenticateJWT, async (req, res) => { // Ensure the user is authenticated
    const username = req.user.username; // Assuming you're using middleware to get the current user

    try {
        // Get the current state of two-factor authentication
        const [user] = await db.query('SELECT two_factor_enabled FROM users WHERE username = ?', [username]);

        if (user.length === 0) {
            logger.warn('User not found for two-factor authentication toggle:', { username });
            return res.status(404).json({ message: 'User not found' });
        }

        const currentStatus = user[0].two_factor_enabled;
        const newStatus = currentStatus === 0 ? 1 : 0;

        // Update the two-factor authentication setting
        await db.query('UPDATE users SET two_factor_enabled = ? WHERE username = ?', [newStatus, username]);

        logger.info('Two-factor authentication toggled successfully for user:', { username, enabled: newStatus });
        res.status(200).json({ message: 'Two-factor authentication toggled successfully', enabled: newStatus });
    } catch (error) {
        logger.error('Error toggling two-factor authentication:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Submit feedback route
router.post('/feedback', authenticateJWT, async (req, res) => { // Ensure the user is authenticated
    const { feedback } = req.body;
    const username = req.user.username; // Assuming you're using middleware to get the current user

    try {
        // Insert feedback into the database
        await db.query('UPDATE users SET feedback = ? WHERE username = ?', [feedback, username]);
        logger.info('Feedback submitted successfully for user:', { username });
        res.status(200).json({ message: 'Feedback submitted successfully' });
    } catch (error) {
        logger.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// View user details route (for Admins)
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
        if (result.length > 0) {
            res.status(200).json(result[0]);
        } else {
            logger.warn('User not found for details:', { id });
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        logger.error('Error retrieving user details:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// View feedback route (for Admins)
router.get('/feedback', async (req, res) => {
    try {
        const [result] = await db.query('SELECT username, feedback FROM users WHERE feedback IS NOT NULL');
        logger.info('Retrieved feedback successfully');
        res.status(200).json(result);
    } catch (error) {
        logger.error('Error retrieving feedback:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Export the router
module.exports = router;


