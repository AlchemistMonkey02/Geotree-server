const express = require('express');
const { createPlantation, getPlantationCount } = require('../controllers/plantationController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { uploadPlantationImages } = require('../utils/fileUtils');

const router = express.Router();

// 📌 Get plantation count (Only authenticated users)
router.get('/plantation-count', authenticateToken, getPlantationCount);

// 📌 Create a new individual plantation
router.post('/individualPlantation', authenticateToken, uploadPlantationImages, createPlantation);

module.exports = router;
