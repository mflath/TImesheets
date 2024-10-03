// logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Set the log level based on the environment variable or default to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';

// Configure the daily rotate file transport
const transport = new DailyRotateFile({
  filename: path.join(__dirname, 'logs', 'application-%DATE%.log'), // Log file name with date
  datePattern: 'YYYY-MM-DD', // Date format for the file
  zippedArchive: true, // Compress the log files
  maxSize: '20m', // Max size of a log file before rotation
  maxFiles: '14d', // Keep logs for 14 days
});

// Create the logger
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(), // Include timestamp in logs
    winston.format.json() // Log in JSON format
  ),
  transports: [
    new winston.transports.Console(), // Log to console
    transport, // Use the daily rotate file transport for logging to files
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), // Log error level logs to a separate file
  ],
});

// Error handling for logger initialization
try {
  logger.info('Logger initialized successfully');
} catch (err) {
  console.error('Logger initialization failed:', err);
}

module.exports = logger; // Export the logger

