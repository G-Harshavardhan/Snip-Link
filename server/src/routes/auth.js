const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post(
  '/signup',
  [
    body('email')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
      .matches(/\d/).withMessage('Password must contain at least one number.'),
    body('name')
      .trim()
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters.')
  ],
  validate,
  authController.signup
);

router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Please enter a valid email address.')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required.')
  ],
  validate,
  authController.login
);

router.get('/me', auth, authController.getMe);

router.delete(
  '/account',
  auth,
  [
    body('password')
      .notEmpty().withMessage('Password is required to delete your account.')
  ],
  validate,
  authController.deleteAccount
);

module.exports = router;
