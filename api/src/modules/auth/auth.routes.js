const express = require('express');
const authController = require('./auth.controller');
const { protect } = require('../../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.use(protect);
router.get('/me', authController.getMe);

module.exports = router;
