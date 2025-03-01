const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const {
    createIndividualPlantation,
    getAllIndividualPlantations,
    getIndividualPlantationById,
    updateIndividualPlantation,
    deleteIndividualPlantation,
    verifyIndividualPlantation
} = require('../controllers/individualPlantationController');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/plantations/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload only images.'), false);
        }
    }
});

// Public routes
router.get('/', getAllIndividualPlantations);
router.get('/:id', getIndividualPlantationById);

// Protected routes (require authentication)
router.use(authenticateToken);

// Create plantation
router.post(
    '/',
    upload.array('photos', 5),
    createIndividualPlantation
);

// Update plantation (admin and authorized roles only)
router.put(
    '/:id',
    authorizeRoles(['admin', 'department_user']),
    upload.array('photos', 5),
    updateIndividualPlantation
);

// Delete plantation (admin only)
router.delete(
    '/:id',
    authorizeRoles(['admin']),
    deleteIndividualPlantation
);

// Verify plantation (admin and verifier roles only)
router.post(
    '/:id/verify',
    authorizeRoles(['admin', 'verifier']),
    verifyIndividualPlantation
);

module.exports = router;
