const express = require('express');
const {
    getUserHistory,
    exportUserHistory,
    getActivityAnalytics,
    updateActivity,
    deleteActivity
} = require('../controllers/userHistoryController');

const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

// 📌 Get user history with filters & pagination
router.get('/user-history', authenticateToken, getUserHistory);

// 📌 Export user history (CSV, Excel, PDF)
router.get('/user-history/export', authenticateToken, exportUserHistory);

// 📌 Get activity analytics
router.get('/user-history/analytics', authenticateToken, getActivityAnalytics);

// 📌 Update user activity
router.put('/user-history/:id', authenticateToken, updateActivity);

// 📌 Delete user activity
router.delete('/user-history/:id', authenticateToken, deleteActivity);

module.exports = router;
