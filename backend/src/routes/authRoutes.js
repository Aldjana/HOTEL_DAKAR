const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, requirePermission, authRateLimiter, loginAccountLimiter } = require('../middleware');
const validators = require('../validators');

router.post('/login', authRateLimiter, loginAccountLimiter, validators.auth.loginValidation, authController.login);
router.post('/refresh-token', authRateLimiter, validators.auth.refreshTokenValidation, authController.refreshToken);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.put('/change-password', auth, validators.auth.changePasswordValidation, authController.changePassword);

// Gestion des utilisateurs : administrateur uniquement
const admin = [auth, requirePermission('users.manage')];
router.post('/register', ...admin, validators.auth.registerValidation, authController.register);
router.get('/users', ...admin, authController.getAllUsers);
router.get('/users/:id', ...admin, authController.getUserById);
router.put('/users/:id', ...admin, validators.auth.updateUserValidation, authController.updateUser);
router.put('/users/:id/reset-password', ...admin, validators.auth.resetPasswordValidation, authController.resetPassword);
router.delete('/users/:id', ...admin, authController.deleteUser);

module.exports = router;
