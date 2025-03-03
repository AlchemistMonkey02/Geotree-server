const express = require('express');
const {
    getAllBlockPlantations,
    updateBlockPlantation,
    deleteBlockPlantation,
    createBlockPlantation,
    getPlantationStatistics,
    verifyPlantation,
    downloadKML
} = require('../controllers/blockPlantationController');
const { authenticateToken, authorizeRoles, protect, restrictTo } = require('../middlewares/authMiddleware');
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

// 📌 Get all block plantations (Admins can only see their city's plantations)
router.get('/all', authenticateToken, getAllBlockPlantations);

// 📌 Update block plantation (Only Admins & Superadmins)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), updateBlockPlantation);

// 📌 Delete block plantation (Only Admins & Superadmins)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), deleteBlockPlantation);

// 📌 Create Block Plantation
router.post('/create', authenticateToken, uploadBlockPlantation.fields([
    { name: 'prePlantationImage', maxCount: 1 },
    { name: 'plantationImage', maxCount: 1 }
]), createBlockPlantation);

// Public routes
router.get('/', getAllBlockPlantations);
router.get('/statistics', getPlantationStatistics);
router.get('/:id/kml', downloadKML);

// Protected routes
router.use(protect);
router.post('/', restrictTo('admin', 'organization'), createBlockPlantation);
router.post('/:id/verify', restrictTo('admin', 'verifier'), verifyPlantation);
router.delete('/:id', restrictTo('admin'), deleteBlockPlantation);

module.exports = router;
