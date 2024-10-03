const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger'); // Import the logger

// Get all activities
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM activities';
  db.query(sql, (err, result) => {
    if (err) {
      logger.error('Error retrieving activities:', err); // Log the error
      return res.status(500).send('Error retrieving activities');
    } 
    logger.info('Retrieved activities successfully'); // Log success
    res.json(result);
  });
});

// Create a new activity
router.post('/', (req, res) => {
  const { name } = req.body;

  // Validate the activity name
  if (!name || name.trim().length < 3) {
    logger.warn('Invalid activity name:', name); // Log warning for invalid input
    return res.status(400).send('Activity name must be at least 3 characters long and cannot be empty.');
  }

  const sql = 'INSERT INTO activities (name) VALUES (?)';
  db.query(sql, [name], (err, result) => {
    if (err) {
      logger.error('Error creating activity:', err); // Log the error
      return res.status(500).send('Error creating activity');
    }
    logger.info('Activity created successfully', { name }); // Log success
    res.status(201).send('Activity created');
  });
});

// Update an activity by ID
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  // Validate the activity name
  if (!name || name.trim().length < 3) {
    logger.warn('Invalid activity name:', name); // Log warning for invalid input
    return res.status(400).send('Activity name must be at least 3 characters long and cannot be empty.');
  }

  const sql = 'UPDATE activities SET name = ? WHERE id = ?';
  db.query(sql, [name, id], (err, result) => {
    if (err) {
      logger.error('Error updating activity:', err); // Log the error
      return res.status(500).send('Error updating activity');
    }
    logger.info(`Activity with ID: ${id} updated successfully`, { name }); // Log success
    res.status(200).send('Activity updated');
  });
});

// Delete an activity by ID
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM activities WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      logger.error('Error deleting activity:', err); // Log the error
      return res.status(500).send('Error deleting activity');
    }
    logger.info(`Activity with ID: ${id} deleted successfully`); // Log success
    res.status(200).send('Activity deleted');
  });
});

// Hide an activity
router.put('/hide/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'UPDATE activities SET is_active = FALSE WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      logger.error('Error hiding activity:', err); // Log the error
      return res.status(500).send('Error hiding activity');
    }
    logger.info(`Activity with ID: ${id} hidden successfully`); // Log success
    res.status(200).send('Activity hidden');
  });
}); 

// Unhide an activity
router.put('/unhide/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'UPDATE activities SET is_active = TRUE WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      logger.error('Error unhiding activity:', err); // Log the error
      return res.status(500).send('Error unhiding activity');
    } 
    logger.info(`Activity with ID: ${id} unhidden successfully`); // Log success
    res.status(200).send('Activity unhidden'); 
  });
});  

// Get all active activities
router.get('/active', (req, res) => {
  const sql = 'SELECT * FROM activities WHERE is_active = 1';
  db.query(sql, (err, result) => {
    if (err) {
      logger.error('Error retrieving active activities:', err); // Log the error
      return res.status(500).send('Error retrieving active activities');
    }
    logger.info('Retrieved active activities successfully'); // Log success
    res.json(result);
  });
});

// Export the router 
module.exports = router;
