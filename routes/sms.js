const express = require('express');
const sms = require('../controllers/sms');

const router = express.Router();

// Handles GET requests for SMS
router.get('/', sms.replySMS);

// Handles POST request for SMS
router.post('/', sms.replySMS);

module.exports = router;