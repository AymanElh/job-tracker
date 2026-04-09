const express = require('express');
const authController = require('./auth.controller');
const { protect } = require('../../middleware/auth');

const validate = require('../../middleware/validate');
const authValidation = require('./auth.validation');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);

// Protected routes
router.use(protect);
router.get('/me', authController.getMe);
router.patch('/updateMe', authController.updateMe);
router.patch('/updatePassword', authController.updatePassword);

module.exports = router;
