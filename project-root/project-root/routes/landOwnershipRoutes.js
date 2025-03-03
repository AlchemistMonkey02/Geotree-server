const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    createLandOwnership,
    getAllLandOwnerships,
    getLandOwnershipById,
    updateLandOwnership,
    deleteLandOwnership,
    verifyLandOwnership
} = require('../controllers/landOwnershipController');

// Protected routes (require authentication)
router.use(authenticateToken);

// Routes accessible by authenticated users
router.get('/', getAllLandOwnerships);
router.get('/:id', getLandOwnershipById);

// Routes for creating and managing land ownership (admin and authorized roles only)
router.post(
    '/',
    authorizeRoles(['admin', 'department_user']),
    createLandOwnership
);

router.put(
    '/:id',
    authorizeRoles(['admin', 'department_user']),
    updateLandOwnership
);

router.delete(
    '/:id',
    authorizeRoles(['admin']),
    deleteLandOwnership
);

// Verification route (admin and verifier roles only)
router.post(
    '/:id/verify',
    authorizeRoles(['admin', 'verifier']),
    verifyLandOwnership
);

module.exports = router; 