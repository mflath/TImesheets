const mysql = require('mysql2/promise');
require('dotenv').config();
const logger = require('./logger'); // Import the logger for logging database events

// Create a connection pool instead of a single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Log the connection status
pool.getConnection()
  .then((connection) => {
    logger.info('Connected to MySQL database');
    connection.release(); // Release the connection back to the pool
  })
  .catch((err) => {
    logger.error('Database connection failed: %s', err.stack); // Log the error if the connection fails
  });

// Export the pool for use in other files
module.exports = pool;

