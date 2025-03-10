const express = require('express');
const IndividualPlantation = require('../models/individualPlantationModel');
const { createIndividualPlantation, getIndividualPlantations } = require('../controllers/individualPlantationController');
const { awardRewardPoints } = require('../controllers/userController');

const router = express.Router();

// Create a new individual plantation
router.post('/', async (req, res) => {
    try {
        const plantation = await createIndividualPlantation(req.body);
        await awardRewardPoints(req.body.createdBy);
        res.status(201).json(plantation);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get all individual plantations
router.get('/', async (req, res) => {
    try {
        const plantations = await getIndividualPlantations();
        res.status(200).json(plantations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single individual plantation by ID
router.get('/:id', async (req, res) => {
    try {
        const individualPlantation = await IndividualPlantation.findById(req.params.id).populate('plants');
        if (!individualPlantation) return res.status(404).json({ message: 'Individual Plantation not found' });
        res.status(200).json(individualPlantation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update an individual plantation by ID
router.put('/:id', async (req, res) => {
    try {
        const individualPlantation = await IndividualPlantation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!individualPlantation) return res.status(404).json({ message: 'Individual Plantation not found' });
        res.status(200).json(individualPlantation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete an individual plantation by ID
router.delete('/:id', async (req, res) => {
    try {
        const individualPlantation = await IndividualPlantation.findByIdAndDelete(req.params.id);
        if (!individualPlantation) return res.status(404).json({ message: 'Individual Plantation not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 