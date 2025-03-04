const express = require('express');
const IndividualPlantation = require('../models/individualPlantationModel');

const router = express.Router();

// Create a new individual plantation
router.post('/', async (req, res) => {
    try {
        const individualPlantation = new IndividualPlantation(req.body);
        await individualPlantation.save();
        res.status(201).json(individualPlantation);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all individual plantations
router.get('/', async (req, res) => {
    try {
        const individualPlantations = await IndividualPlantation.find().populate('plants');
        res.status(200).json(individualPlantations);
    } catch (err) {
        res.status(500).json({ message: err.message });
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