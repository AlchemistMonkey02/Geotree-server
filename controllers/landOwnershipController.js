const LandOwnership = require('../models/landOwnershipModel');

// Create new land ownership record
exports.createLandOwnership = async (req, res) => {
    try {
        const landOwnershipData = {
            ownershipType: req.body.ownershipType,
            ownerName: req.body.ownerName,
            landArea: req.body.landArea,
            boundaries: {
                type: 'Polygon',
                coordinates: req.body.boundaries.coordinates
            },
            landUseType: req.body.landUseType
        };

        const landOwnership = new LandOwnership(landOwnershipData);
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

// Get all land ownership records with filters
exports.getAllLandOwnerships = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        if (req.query.ownershipType) filter.ownershipType = req.query.ownershipType;
        if (req.query.landUseType) filter.landUseType = req.query.landUseType;
        if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;

        // Add geospatial query if coordinates are provided
        if (req.query.near) {
            const [longitude, latitude] = req.query.near.split(',').map(Number);
            filter.boundaries = {
                $geoIntersects: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    }
                }
            };
        }

        const [landOwnerships, total] = await Promise.all([
            LandOwnership.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('verifiedBy', 'firstName lastName email'),
            LandOwnership.countDocuments(filter)
        ]);

        res.status(200).json({
            status: 'success',
            data: landOwnerships,
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

// Get land ownership by ID
exports.getLandOwnershipById = async (req, res) => {
    try {
        const landOwnership = await LandOwnership.findById(req.params.id)
            .populate('verifiedBy', 'firstName lastName email');

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

// Update land ownership
exports.updateLandOwnership = async (req, res) => {
    try {
        const updateData = {
            ownershipType: req.body.ownershipType,
            ownerName: req.body.ownerName,
            landArea: req.body.landArea,
            boundaries: {
                type: 'Polygon',
                coordinates: req.body.boundaries.coordinates
            },
            landUseType: req.body.landUseType
        };

        const landOwnership = await LandOwnership.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('verifiedBy', 'firstName lastName email');

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

// Find overlapping land ownerships
exports.findOverlappingLandOwnerships = async (req, res) => {
    try {
        const { coordinates } = req.body;

        const overlappingLandOwnerships = await LandOwnership.find({
            boundaries: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Polygon',
                        coordinates: coordinates
                    }
                }
            }
        });

        res.status(200).json({
            status: 'success',
            data: overlappingLandOwnerships
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete land ownership
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

// Verify land ownership
exports.verifyLandOwnership = async (req, res) => {
    try {
        const { status, comments } = req.body;
        
        const landOwnership = await LandOwnership.findByIdAndUpdate(
            req.params.id,
            {
                verificationStatus: status,
                verificationComments: comments,
                verifiedBy: req.user._id,
                verificationDate: Date.now()
            },
            { new: true, runValidators: true }
        ).populate('verifiedBy', 'firstName lastName email');

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