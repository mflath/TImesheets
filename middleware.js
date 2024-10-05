const jwt = require('jsonwebtoken');
const logger = require('./logger'); // Ensure to import logger if not already done

// Middleware to authenticate JWT
function authenticateJWT(req, res, next) {
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

  if (!token) {
    logger.warn('No token provided');
    return res.sendStatus(401); // Unauthorized if no token
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token provided');
      return res.sendStatus(403); // Forbidden if token is invalid
    }
    
    req.user = user; // Attach user information to the request
    console.log('Decoded user:', user); // Log the decoded user information
    logger.info('Token verified successfully for user:', { username: user.username }); // Log successful verification
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = authenticateJWT; // Export the middleware
