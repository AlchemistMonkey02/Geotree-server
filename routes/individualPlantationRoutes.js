const express = require('express');
const { 
    createIndividualPlantation, 
    getAllIndividualPlantations, 
    getIndividualPlantationById, 
    updateIndividualPlantation, 
    deleteIndividualPlantation, 
    verifyIndividualPlantation, 
    downloadKML, 
    getDashboardStatistics 
} = require('../controllers/individualPlantationController');
const { uploadPlantationImages } = require('../utils/fileUtils'); // Import the upload function

const router = express.Router();

// Create a new individual plantation (with file upload support)
router.post('/', uploadPlantationImages, createIndividualPlantation); // Use the imported upload function

// Get all plantations with filters & pagination
router.get('/', getAllIndividualPlantations);

// Get a single plantation by ID
router.get('/:id', getIndividualPlantationById);

// Update a plantation by ID
router.put('/:id', uploadPlantationImages, updateIndividualPlantation); // Use the imported upload function

// Delete a plantation by ID
router.delete('/:id', deleteIndividualPlantation);

// Verify a plantation (Admin only)
router.put('/:id/verify', verifyIndividualPlantation);

// Get dashboard statistics
router.get('/dashboard/stats', getDashboardStatistics);

// Download KML file for a plantation
router.get('/:id/download-kml', downloadKML);

module.exports = router;
