const express = require('express');
const Plant = require('../models/plantModel');

const router = express.Router();

// Create a new plant
router.post('/', async (req, res) => {
    try {
        const plant = new Plant(req.body);
        await plant.save();
        res.status(201).json(plant);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all plants
router.get('/', async (req, res) => {
    try {
        const plants = await Plant.find();
        res.status(200).json(plants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get a single plant by ID
router.get('/:id', async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.id);
        if (!plant) return res.status(404).json({ message: 'Plant not found' });
        res.status(200).json(plant);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update a plant by ID
router.put('/:id', async (req, res) => {
    try {
        const plant = await Plant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!plant) return res.status(404).json({ message: 'Plant not found' });
        res.status(200).json(plant);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a plant by ID
router.delete('/:id', async (req, res) => {
    try {
        const plant = await Plant.findByIdAndDelete(req.params.id);
        if (!plant) return res.status(404).json({ message: 'Plant not found' });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 