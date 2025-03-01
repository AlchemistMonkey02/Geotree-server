const express = require('express');
const { createAdmin, initializeAdmin } = require('../controllers/adminController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { adminGetAllUserHistory, deleteActivity } = require('../controllers/userHistoryController');

const router = express.Router();

// 📌 Initialize and Create Admin Routes
router.get('/initialize-admin', initializeAdmin);
router.post('/create-admin', authenticateToken, authorizeRoles('superadmin'), createAdmin);

// 📌 Admin can view all user activities
router.get('/user-history', authenticateToken, authorizeRoles('admin', 'superadmin'), adminGetAllUserHistory);

// 📌 Admin can delete any user's activity
router.delete('/delete-activity/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), deleteActivity);

module.exports = router;
