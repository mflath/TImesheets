const express = require('express');
const mysql = require('mysql2');
require('dotenv').config();
const logger = require('./logger'); // Import the logger for logging events
const userRoutes = require('./routes/users');
const timesheetsRoutes = require('./routes/timesheets'); // Import timesheets routes
const activitiesRoutes = require('./routes/activities'); // Import activities routes

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// MySQL connection setup
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    logger.error('Database connection failed: %s', err.stack); // Log the error if the connection fails
    return;
  }
  logger.info('Connected to MySQL database'); // Log info on successful connection
});

// Mounting user routes
app.use('/users', userRoutes); // Mounting user routes

// Mounting timesheet routes
app.use('/api/timesheets', timesheetsRoutes); // Mounting under '/api'

// Mounting activities routes
app.use('/api/activities', activitiesRoutes); // Mounting under '/api/activities'

// Test route added
app.get('/api/test', (req, res) => {
  res.send('Test route working directly from app.js!');
});

// Basic route for the home page
app.get('/', (req, res) => {
  res.send('Welcome to the Timesheet App!');
});

// Start the server
app.listen(port, () => {
  logger.info('Server running on port %d', port); // Log info on server startup
});




