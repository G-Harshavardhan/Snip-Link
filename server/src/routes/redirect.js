const express = require('express');
const redirectController = require('../controllers/redirectController');

const router = express.Router();

// Handle short URL redirects
router.get('/:shortCode', redirectController.handleRedirect);

module.exports = router;
