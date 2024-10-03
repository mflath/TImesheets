const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT
function authenticateJWT(req, res, next) {
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

  if (!token) {
    return res.sendStatus(401); // Unauthorized if no token
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); // Forbidden if token is invalid
    }

    req.user = user; // Attach user information to the request
    next(); // Proceed to the next middleware or route handler
  });
}

module.exports = authenticateJWT; // Export the middleware

