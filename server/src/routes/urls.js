const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const urlController = require('../controllers/urlController');

const router = express.Router();

// All routes are protected
router.use(auth);

// Create short URL
router.post(
  '/',
  [
    body('originalUrl')
      .isURL({ require_protocol: true }).withMessage('Please enter a valid URL.'),
    body('customAlias')
      .optional()
      .isLength({ min: 3, max: 30 }).withMessage('Custom alias must be 3-30 characters.')
      .matches(/^[a-zA-Z0-9_-]+$/).withMessage('Custom alias can only contain letters, numbers, hyphens, and underscores.'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Title must be under 100 characters.'),
    body('expiresAt')
      .optional()
      .isISO8601().withMessage('Invalid expiry date format.')
  ],
  validate,
  urlController.createUrl
);

// Create bulk short URLs
router.post('/bulk', urlController.createUrlsBulk);

// Get all user URLs
router.get('/', urlController.getUserUrls);

// Get single URL
router.get('/:id', urlController.getUrlById);

// Update URL
router.put(
  '/:id',
  [
    body('originalUrl')
      .optional()
      .isURL({ require_protocol: true }).withMessage('Please enter a valid URL.'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 100 }).withMessage('Title must be under 100 characters.'),
    body('expiresAt')
      .optional({ nullable: true })
      .isISO8601().withMessage('Invalid expiry date format.')
  ],
  validate,
  urlController.updateUrl
);

// Delete URL
router.delete('/:id', urlController.deleteUrl);

// Get analytics
router.get('/:id/analytics', urlController.getUrlAnalytics);

// Get QR code
router.get('/:id/qr', urlController.getQrCode);

module.exports = router;
