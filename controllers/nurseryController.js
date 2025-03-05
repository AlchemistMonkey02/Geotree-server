const Nursery = require("../models/nursery");

// Function to generate a random nursery ID
const generateNurseryId = () => {
    return `nursery_random_${Math.floor(Math.random() * 1000000)}`; // Generates a random number
};

// Create a new nursery
exports.createNursery = async (req, res) => {
    try {
        const nursery = new Nursery(req.body);
        await nursery.save();
        res.status(201).json(nursery);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all nurseries
exports.getAllNurseries = async (req, res) => {
    try {
        const nurseries = await Nursery.find().populate('district gp ownership');
        res.status(200).json(nurseries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a nursery by ID
exports.getNurseryById = async (req, res) => {
    try {
        const nursery = await Nursery.findById(req.params.id).populate('district gp ownership');
        if (!nursery) {
            return res.status(404).json({ message: "Nursery not found" });
        }
        res.status(200).json(nursery);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a nursery
exports.updateNursery = async (req, res) => {
    try {
        const nursery = await Nursery.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!nursery) {
            return res.status(404).json({ message: "Nursery not found" });
        }
        res.status(200).json(nursery);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a nursery
exports.deleteNursery = async (req, res) => {
    try {
        const nursery = await Nursery.findByIdAndDelete(req.params.id);
        if (!nursery) {
            return res.status(404).json({ message: "Nursery not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 