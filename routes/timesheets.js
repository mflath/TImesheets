const express = require('express');
const router = express.Router();
const db = require('../db');
const logger = require('../logger'); // Import the logger
const authenticateJWT = require('../middleware'); // Import the authentication middleware

// Protect all routes
router.use(authenticateJWT); // Add this line to protect all routes with JWT authentication

// Get all timesheets
router.get('/', async (req, res) => {
  const sql = 'SELECT * FROM timesheets';
  try {
    const [result] = await db.query(sql);
    logger.info('Retrieved timesheets successfully');
    return res.json(result);
  } catch (err) {
    logger.error('Error retrieving timesheets:', err);
    return res.status(500).send('Error retrieving timesheets');
  }
});

// Create a new timesheet
router.post('/', async (req, res) => {
  const { employee_id, hours, date, activity_id } = req.body;

  try {
    // Validate employee_id exists
    const [employeeResult] = await db.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (employeeResult.length === 0) {
      logger.warn('Invalid employee ID:', employee_id);
      return res.status(400).send('Invalid employee ID');
    }

    // Validate hours
    if (!/^\d+(\.\d+)?$/.test(hours) || hours < 0 || hours > 24) {
      logger.warn('Invalid hours input:', hours);
      return res.status(400).send('Hours must be a valid decimal number between 0 and 24');
    }

    // Validate date format (YYYY-MM-DD) and that it is not in the past
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date) < new Date()) {
      logger.warn('Invalid date format:', date);
      return res.status(400).send('Date must be in YYYY-MM-DD format and not in the past');
    }

    const sql = 'INSERT INTO timesheets (employee_id, hours, date, activity_id) VALUES (?, ?, ?, ?)';
    await db.query(sql, [employee_id, hours, date, activity_id]);
    logger.info('Timesheet created successfully', { employee_id, hours, date, activity_id });
    return res.status(201).send('Timesheet created');
  } catch (err) {
    logger.error('Error creating timesheet:', err);
    return res.status(500).send('Error creating timesheet');
  }
});

// Route to submit a vacation request
router.post('/vacation-request', async (req, res) => {
  const { employee_id, vacation_start, vacation_end } = req.body;

  try {
    await db.query(
      'INSERT INTO vacation_requests (employee_id, request_date, vacation_start, vacation_end) VALUES (?, NOW(), ?, ?)',
      [employee_id, vacation_start, vacation_end]
    );
    logger.info('Vacation request submitted successfully', { employee_id, vacation_start, vacation_end });
    return res.status(201).json({ message: 'Vacation request submitted successfully' });
  } catch (err) {
    logger.error('Error submitting vacation request:', err);
    return res.status(500).json({ error: 'Vacation request submission failed' });
  }
});

// Route for supervisor to approve/deny vacation request
router.put('/vacation-request/:id', async (req, res) => {
  const requestId = req.params.id;
  const { status } = req.body;

  try {
    await db.query('UPDATE vacation_requests SET status = ? WHERE id = ?', [status, requestId]);
    logger.info(`Vacation request ${status} successfully for request ID: ${requestId}`);
    return res.status(200).json({ message: `Vacation request ${status}` });
  } catch (err) {
    logger.error('Error updating vacation request status:', err);
    return res.status(500).json({ error: 'Failed to update vacation request status' });
  }
});

// Delete a timesheet by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM timesheets WHERE id = ?';
  try {
    await db.query(sql, [id]);
    logger.info(`Timesheet with ID: ${id} deleted successfully`);
    return res.status(200).send('Timesheet deleted');
  } catch (err) {
    logger.error('Error deleting timesheet:', err);
    return res.status(500).send('Error deleting timesheet');
  }
});

// Route to get employee's current time balances
router.get('/employee/:id/balances', async (req, res) => {
  const employee_id = req.params.id;

  try {
    const [result] = await db.query('SELECT vacation_accrued, sick_time_accrued, unpaid_time, total_hours_worked FROM employees WHERE id = ?', [employee_id]);
    const balances = result[0];
    logger.info(`Retrieved balances for employee ID: ${employee_id}`);
    return res.status(200).json({ balances });
  } catch (err) {
    logger.error('Error fetching balances:', err);
    return res.status(500).json({ error: 'Failed to retrieve balances' });
  }
});

// Update a timesheet by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { employee_id, hours, date, activity_id } = req.body;

  try {
    // Validate employee_id exists
    const [employeeResult] = await db.query('SELECT id FROM employees WHERE id = ?', [employee_id]);
    if (employeeResult.length === 0) {
      logger.warn('Invalid employee ID:', employee_id);
      return res.status(400).send('Invalid employee ID');
    }

    // Validate hours
    if (!/^\d+(\.\d+)?$/.test(hours) || hours < 0 || hours > 24) {
      logger.warn('Invalid hours input:', hours);
      return res.status(400).send('Hours must be a valid decimal number between 0 and 24');
    }

    // Validate date format (YYYY-MM-DD) and that it is not in the past
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date) < new Date()) {
      logger.warn('Invalid date format:', date);
      return res.status(400).send('Date must be in YYYY-MM-DD format and not in the past');
    }

    const sql = 'UPDATE timesheets SET employee_id = ?, hours = ?, date = ?, activity_id = ? WHERE id = ?';
    await db.query(sql, [employee_id, hours, date, activity_id, id]);
    logger.info(`Timesheet with ID: ${id} updated successfully`, { employee_id, hours, date, activity_id });
    return res.status(200).send('Timesheet updated');
  } catch (err) {
    logger.error('Error updating timesheet:', err);
    return res.status(500).send('Error updating timesheet');
  }
});

// Get all employees
router.get('/employees', async (req, res) => {
  const sql = 'SELECT * FROM employees';
  try {
    const [result] = await db.query(sql);
    logger.info('Retrieved employees successfully');
    return res.json(result);
  } catch (err) {
    logger.error('Error retrieving employees:', err);
    return res.status(500).send('Error retrieving employees');
  }
});

// Get all activities
router.get('/activities', async (req, res) => {
  const sql = 'SELECT * FROM activities';
  try {
    const [result] = await db.query(sql);
    logger.info('Retrieved activities successfully');
    return res.json(result);
  } catch (err) {
    logger.error('Error retrieving activities:', err);
    return res.status(500).send('Error retrieving activities');
  }
});

// Create a new activity
router.post('/activities', async (req, res) => {
  const { name } = req.body; // Extracting the activity name from the request body

  // Validate activity name
  if (!name || name.length < 3) {
    logger.warn('Invalid activity name input:', name); // Log warning for invalid name
    return res.status(400).send('Activity name must be at least 3 characters long and cannot be empty.');
  }

  const sql = 'INSERT INTO activities (name) VALUES (?)'; // SQL query to insert the new activity

  try {
    await db.query(sql, [name]); // Execute the SQL query
    logger.info('Activity created successfully', { name }); // Log success
    return res.status(201).send('Activity created'); // Send a success response
  } catch (err) {
    logger.error('Error creating activity:', err); // Log the error
    return res.status(500).send('Error creating activity'); // Send an error response
  }
});

// Update an employee by ID
router.put('/employees/:id', async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, role, hire_date } = req.body;
  const sql = 'UPDATE employees SET first_name = ?, last_name = ?, position = ?, start_date = ? WHERE id = ?';

  try {
    await db.query(sql, [first_name, last_name, role, hire_date, id]);
    logger.info(`Employee with ID: ${id} updated successfully`, { first_name, last_name, role, hire_date }); // Log success
    return res.status(200).send('Employee updated');
  } catch (err) {
    logger.error('Error updating employee:', err); // Log the error
    return res.status(500).send('Error updating employee');
  }
});

module.exports = router; // Export the router

