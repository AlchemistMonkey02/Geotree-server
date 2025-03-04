const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    createTreePlantation,
    getAllTreePlantations,
    getTreePlantationById,
    updateTreePlantation,
    deleteTreePlantation,
    getStatistics
} = require('../controllers/treePlantationController');

// Public routes
router.get('/statistics', getStatistics);
router.get('/', getAllTreePlantations);
router.get('/:id', getTreePlantationById);

// Protected routes (require authentication)
router.use(authenticateToken);

// Create plantation (admin and authorized roles only)
router.post(
    '/',
    authorizeRoles(['admin', 'department_user']),
    createTreePlantation
);

router.post(" ")
// Update plantation (admin and authorized roles only)
router.put(
    '/:id',
    authorizeRoles(['admin', 'department_user']),
    updateTreePlantation
);

// Delete plantation (admin only)
router.delete(
    '/:id',
    authorizeRoles(['admin']),
    deleteTreePlantation
);

module.exports = router; 