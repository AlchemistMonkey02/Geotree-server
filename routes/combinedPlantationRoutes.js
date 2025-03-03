const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const {
    getCombinedPlantations,
    getCombinedDashboardStatistics
} = require('../controllers/combinedPlantationController');

// Public routes
router.get('/', getCombinedPlantations);
router.get('/dashboard', getCombinedDashboardStatistics);

// Protected routes (require authentication)
router.use(authenticateToken);

// No protected routes yet, but can be added here if needed

module.exports = router; 