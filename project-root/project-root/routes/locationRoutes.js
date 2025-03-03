const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    getAllStates,
    getDistrictsByState,
    getVillagesByDistrict,
    getGPsByVillage,
    getDepartments,
    createState,
    createDistrict,
    createVillage,
    createGP,
    createDepartment
} = require('../controllers/locationController');

// Public routes for fetching data
router.get('/states', getAllStates);
router.get('/districts/:stateId', getDistrictsByState);
router.get('/villages/:districtId', getVillagesByDistrict);
router.get('/gps/:villageId', getGPsByVillage);
router.get('/departments', getDepartments);

// Protected routes for creating data (admin only)
router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

router.post('/states', createState);
router.post('/districts', createDistrict);
router.post('/villages', createVillage);
router.post('/gps', createGP);
router.post('/departments', createDepartment);

module.exports = router; 