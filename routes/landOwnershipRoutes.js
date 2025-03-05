const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    createLandOwnership,
    getAllLandOwnerships,
    getLandOwnershipById,
    updateLandOwnership,
    deleteLandOwnership
} = require('../controllers/landOwnershipController'); // ✅ Ensure the correct import path!

// ✅ Protect all routes with authentication
router.use(authenticateToken);

// ✅ Routes accessible by all authenticated users
router.get('/', getAllLandOwnerships);
router.get('/:id', getLandOwnershipById);

// ✅ Routes restricted to 'admin' and 'department_user' roles
router.post('/', authorizeRoles(['admin', 'department_user']), createLandOwnership);
router.put('/:id', authorizeRoles(['admin', 'department_user']), updateLandOwnership);

// ✅ Delete allowed only for 'admin'
router.delete('/:id', authorizeRoles(['admin']), deleteLandOwnership);

module.exports = router;
