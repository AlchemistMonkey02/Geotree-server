const express = require('express');
const {
    getAllBlockPlantations,
    deleteBlockPlantation,
    createBlockPlantation,
    getPlantationStatistics,
    verifyPlantation,
    downloadKML,
    updateBlockPlantation,
    getDashboardStatistics
} = require('../controllers/blockPlantationController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const blockPlantationStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/blockplantation/';
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploadBlockPlantation = multer({
    storage: blockPlantationStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

const router = express.Router();

// Public routes
router.get('/', getAllBlockPlantations);
router.get('/statistics', getPlantationStatistics);
router.get('/dashboard', getDashboardStatistics);
router.get('/:id/kml', downloadKML);

// Protected routes - using authenticateToken
router.get('/all', authenticateToken, getAllBlockPlantations);
router.post('/', authenticateToken, authorizeRoles('admin', 'organization'), uploadBlockPlantation.fields([
    { name: 'prePlantationImage', maxCount: 1 },
    { name: 'plantationImage', maxCount: 1 }
]), createBlockPlantation);
router.put('/:id', authenticateToken, authorizeRoles('admin', 'organization'), updateBlockPlantation);
router.post('/:id/verify', authenticateToken, authorizeRoles('admin', 'verifier'), verifyPlantation);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteBlockPlantation);

module.exports = router;
