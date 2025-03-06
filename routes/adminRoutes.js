const express = require('express');
const { createAdmin, initializeAdmin } = require('../controllers/adminController');
const { authenticateToken } = require('../utils/auth');
const { adminGetAllUserHistory, deleteActivity } = require('../controllers/userHistoryController');
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

// Protect admin routes with the authentication and admin middleware
router.use(authenticateToken);
router.use(adminMiddleware);

// 📌 Initialize and Create Admin Routes
router.get('/initialize-admin', initializeAdmin);
router.post('/create-admin', createAdmin);

// 📌 Admin can view all user activities
router.get('/user-history', adminGetAllUserHistory);

// 📌 Admin can delete any user's activity
router.delete('/delete-activity/:id', deleteActivity);

// Temporary route to initialize super admin
router.post('/initialize-admin', initializeAdmin);

// Define your admin routes here
router.get("/dashboard", (req, res) => {
    res.status(200).json({ message: "Welcome to the admin dashboard!" });
});

module.exports = router;
