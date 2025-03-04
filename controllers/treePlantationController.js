const TreePlantation = require('../models/treePlantationModel');

// Create new tree plantation record
exports.createTreePlantation = async (req, res) => {
    try {
        const plantation = new TreePlantation(req.body);
        await plantation.save();

        res.status(201).json({
            status: 'success',
            data: plantation
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get all tree plantations with filters and pagination
exports.getAllTreePlantations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object from query parameters
        const filter = {};
        if (req.query.stateUT) filter.stateUT = req.query.stateUT;
        if (req.query.district) filter.district = req.query.district;
        if (req.query.department) filter.department = req.query.department;
        if (req.query.placeCategory) filter.placeCategory = req.query.placeCategory;
        if (req.query.startDate && req.query.endDate) {
            filter.plantationDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const [plantations, total] = await Promise.all([
            TreePlantation.find(filter)
                .sort({ plantationDate: -1 })
                .skip(skip)
                .limit(limit),
            TreePlantation.countDocuments(filter)
        ]);

        res.status(200).json({
            status: 'success',
            data: plantations,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                recordsPerPage: limit
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get tree plantation by ID
exports.getTreePlantationById = async (req, res) => {
    try {
        const plantation = await TreePlantation.findById(req.params.id);
        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Tree plantation record not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: plantation
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update tree plantation
exports.updateTreePlantation = async (req, res) => {
    try {
        const plantation = await TreePlantation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Tree plantation record not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: plantation
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete tree plantation
exports.deleteTreePlantation = async (req, res) => {
    try {
        const plantation = await TreePlantation.findByIdAndDelete(req.params.id);
        
        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Tree plantation record not found'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Tree plantation record deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get statistics
exports.getStatistics = async (req, res) => {
    try {
        const stats = await TreePlantation.aggregate([
            {
                $group: {
                    _id: null,
                    totalPlantations: { $sum: 1 },
                    totalTrees: { $sum: '$numberOfTrees' },
                    averageTreesPerPlantation: { $avg: '$numberOfTrees' }
                }
            }
        ]);

        const stateWiseStats = await TreePlantation.aggregate([
            {
                $group: {
                    _id: '$stateUT',
                    totalPlantations: { $sum: 1 },
                    totalTrees: { $sum: '$numberOfTrees' }
                }
            },
            { $sort: { totalTrees: -1 } }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                overall: stats[0],
                stateWise: stateWiseStats
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}; 