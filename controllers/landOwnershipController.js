const LandOwnership = require('../models/landOwnershipModel');

// 🚀 Create new land ownership record
exports.createLandOwnership = async (req, res) => {
    try {
        const { ownershipType } = req.body;

        const landOwnership = new LandOwnership({ ownershipType });
        await landOwnership.save();

        res.status(201).json({
            status: 'success',
            data: landOwnership
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// 🚀 Get all land ownership records
exports.getAllLandOwnerships = async (req, res) => {
    try {
        const landOwnerships = await LandOwnership.find({}, { ownershipType: 1, _id: 0 });

        res.status(200).json({
            status: 'success',
            data: landOwnerships
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// 🚀 Get land ownership by ID
exports.getLandOwnershipById = async (req, res) => {
    try {
        const landOwnership = await LandOwnership.findById(req.params.id);

        if (!landOwnership) {
            return res.status(404).json({
                status: 'error',
                message: 'Land ownership record not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: landOwnership
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// 🚀 Update land ownership record
exports.updateLandOwnership = async (req, res) => {
    try {
        const { ownershipType } = req.body;

        const landOwnership = await LandOwnership.findByIdAndUpdate(
            req.params.id,
            { ownershipType },
            { new: true, runValidators: true }
        );

        if (!landOwnership) {
            return res.status(404).json({
                status: 'error',
                message: 'Land ownership record not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: landOwnership
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// 🚀 Delete land ownership record
exports.deleteLandOwnership = async (req, res) => {
    try {
        const landOwnership = await LandOwnership.findByIdAndDelete(req.params.id);
        
        if (!landOwnership) {
            return res.status(404).json({
                status: 'error',
                message: 'Land ownership record not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Land ownership record deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};
