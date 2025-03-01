const express = require('express');
const router = express.Router();
const { signup, login, logout, forgotPassword, resetPassword, verifyEmail, verifyOTP, refreshToken } = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const passport = require('passport');

// 📌 Authentication Routes
router.post('/signup', signup);  // Ensure `signup` is properly imported and defined
router.post('/login', login);    // Ensure `login` is properly imported and defined
router.post('/logout', authenticateToken, logout);  // Ensure `logout` is properly imported and defined
router.get('/verify-email/:token', verifyEmail);   // Ensure `verifyEmail` is properly imported and defined
router.post('/verify-otp', verifyOTP);   // Ensure `verifyOTP` is properly imported and defined
router.post('/refresh-token', refreshToken);   // Ensure `refreshToken` is properly imported and defined

// 📌 Password Reset Routes
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// 📌 Google Login Route
router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 📌 Google Callback Route
router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    }
);


module.exports = router;
