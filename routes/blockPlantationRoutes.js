const express = require('express');
const {
    getAllBlockPlantations,
    deleteBlockPlantation,
    createBlockPlantation,
    getPlantationStatistics,
    verifyPlantation,
    downloadKML,
    updateBlockPlantation,
    getDashboardStatistics,
    getBlockPlantations
} = require('../controllers/blockPlantationController');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const BlockPlantation = require('../models/blockPlantationModel');
const { awardRewardPoints } = require('../controllers/userController'); // Import the function to award points

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
]), async (req, res) => {
    try {
        const plantation = await createBlockPlantation(req.body);
        await awardRewardPoints(req.body.createdBy); // Award points to the user who created the plantation
        res.status(201).json(plantation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});
router.put('/:id', authenticateToken, authorizeRoles('admin', 'organization'), updateBlockPlantation);
router.post('/:id/verify', authenticateToken, authorizeRoles('admin', 'verifier'), verifyPlantation);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), deleteBlockPlantation);

// Get all block plantations
router.get('/', async (req, res) => {
    try {
        const plantations = await getBlockPlantations();
        res.status(200).json(plantations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single block plantation by ID
router.get('/:id', async (req, res) => {
    try {
        const blockPlantation = await BlockPlantation.findById(req.params.id).populate('plants');
        if (!blockPlantation) return res.status(404).json({ message: 'Block Plantation not found' });
        res.status(200).json(blockPlantation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a block plantation by ID
router.put('/:id', async (req, res) => {
    try {
        const blockPlantation = await BlockPlantation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!blockPlantation) return res.status(404).json({ message: 'Block Plantation not found' });
        res.status(200).json(blockPlantation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a block plantation by ID
router.delete('/:id', async (req, res) => {
    try {
        const blockPlantation = await BlockPlantation.findByIdAndDelete(req.params.id);
        if (!blockPlantation) return res.status(404).json({ message: 'Block Plantation not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
