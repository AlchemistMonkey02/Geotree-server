const NurseryDetails = require("../models/nurseryDetailsSchema");

// Create a new NurseryDetails entry
exports.createNurseryDetails = async (req, res) => {
    try {
        const nurseryDetails = new NurseryDetails(req.body);
        await nurseryDetails.save();
        res.status(201).json(nurseryDetails);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all NurseryDetails entries
exports.getAllNurseryDetails = async (req, res) => {
    try {
        const nurseryDetails = await NurseryDetails.find().populate('nurseryId').populate('plantHistory.plantId');
        res.status(200).json(nurseryDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a specific NurseryDetails entry by ID
exports.getNurseryDetailsById = async (req, res) => {
    try {
        const nurseryDetails = await NurseryDetails.findById(req.params.id).populate('nurseryId').populate('plantHistory.plantId');
        if (!nurseryDetails) {
            return res.status(404).json({ message: "NurseryDetails not found" });
        }
        res.status(200).json(nurseryDetails);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a NurseryDetails entry
exports.updateNurseryDetails = async (req, res) => {
    try {
        const nurseryDetails = await NurseryDetails.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!nurseryDetails) {
            return res.status(404).json({ message: "NurseryDetails not found" });
        }
        res.status(200).json(nurseryDetails);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a NurseryDetails entry
exports.deleteNurseryDetails = async (req, res) => {
    try {
        const nurseryDetails = await NurseryDetails.findByIdAndDelete(req.params.id);
        if (!nurseryDetails) {
            return res.status(404).json({ message: "NurseryDetails not found" });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}; 