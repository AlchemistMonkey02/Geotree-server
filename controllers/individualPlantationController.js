const IndividualPlantation = require('../models/individualPlantationModel');
const LandOwnership = require('../models/landOwnershipModel');

// Create new individual plantation
exports.createIndividualPlantation = async (req, res) => {
    try {
        // Create land ownership record first
        const landOwnershipData = {
            ownershipType: req.body.landOwnership.ownershipType,
            ownerName: req.body.landOwnership.ownerName,
            landArea: req.body.landOwnership.landArea,
            boundaries: {
                type: 'Polygon',
                coordinates: req.body.landOwnership.boundaries.coordinates
            },
            landUseType: req.body.landOwnership.landUseType
        };

        const landOwnership = new LandOwnership(landOwnershipData);
        await landOwnership.save();

        // Create plantation with land ownership reference
        const plantationData = {
            treeType: req.body.treeType,
            height: req.body.height,
            state: req.body.state,
            district: req.body.district,
            village: req.body.village,
            gramPanchayat: req.body.gramPanchayat,
            landOwnership: landOwnership._id,
            location: req.body.location,
            plantationDate: req.body.plantationDate,
            contactNumber: req.body.contactNumber,
            email: req.body.email,
            createdBy: req.user._id
        };

        // Handle file uploads if present
        if (req.files && req.files.length > 0) {
            plantationData.photos = req.files.map(file => ({
                url: file.path,
                caption: file.originalname
            }));
        }

        // Validate that plantation location is within land boundaries
        const isWithinBoundaries = await LandOwnership.findOne({
            _id: landOwnership._id,
            boundaries: {
                $geoIntersects: {
                    $geometry: plantationData.location
                }
            }
        });

        if (!isWithinBoundaries) {
            throw new Error('Plantation location must be within the specified land boundaries');
        }

        const plantation = new IndividualPlantation(plantationData);
        await plantation.save();

        res.status(201).json({
            status: 'success',
            data: {
                plantation,
                landOwnership
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get all individual plantations with filters
exports.getAllIndividualPlantations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.treeType) filter.treeType = req.query.treeType;
        if (req.query.state) filter.state = req.query.state;
        if (req.query.district) filter.district = req.query.district;
        if (req.query.village) filter.village = req.query.village;
        if (req.query.gramPanchayat) filter.gramPanchayat = req.query.gramPanchayat;

        // Date range filter
        if (req.query.startDate && req.query.endDate) {
            filter.plantationDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const [plantations, total] = await Promise.all([
            IndividualPlantation.find(filter)
                .populate('state district village gramPanchayat landOwnership createdBy verifiedBy')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            IndividualPlantation.countDocuments(filter)
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

// Get individual plantation by ID
exports.getIndividualPlantationById = async (req, res) => {
    try {
        const plantation = await IndividualPlantation.findById(req.params.id)
            .populate('state district village gramPanchayat landOwnership createdBy verifiedBy');

        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Individual plantation not found'
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

// Update individual plantation
exports.updateIndividualPlantation = async (req, res) => {
    try {
        const plantation = await IndividualPlantation.findById(req.params.id);
        
        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Individual plantation not found'
            });
        }

        // Update land ownership if provided
        if (req.body.landOwnership) {
            const landOwnershipData = {
                ownershipType: req.body.landOwnership.ownershipType,
                ownerName: req.body.landOwnership.ownerName,
                landArea: req.body.landOwnership.landArea,
                boundaries: {
                    type: 'Polygon',
                    coordinates: req.body.landOwnership.boundaries.coordinates
                },
                landUseType: req.body.landOwnership.landUseType
            };

            await LandOwnership.findByIdAndUpdate(
                plantation.landOwnership,
                landOwnershipData,
                { runValidators: true }
            );

            // Validate that plantation location is within updated land boundaries
            if (req.body.location) {
                const isWithinBoundaries = await LandOwnership.findOne({
                    _id: plantation.landOwnership,
                    boundaries: {
                        $geoIntersects: {
                            $geometry: req.body.location
                        }
                    }
                });

                if (!isWithinBoundaries) {
                    throw new Error('Updated plantation location must be within the specified land boundaries');
                }
            }
        }

        // Handle file uploads if present
        if (req.files && req.files.length > 0) {
            const newPhotos = req.files.map(file => ({
                url: file.path,
                caption: file.originalname
            }));
            req.body.photos = [...(plantation.photos || []), ...newPhotos];
        }

        const updatedPlantation = await IndividualPlantation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('state district village gramPanchayat landOwnership createdBy verifiedBy');

        res.status(200).json({
            status: 'success',
            data: updatedPlantation
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete individual plantation
exports.deleteIndividualPlantation = async (req, res) => {
    try {
        const plantation = await IndividualPlantation.findById(req.params.id);
        
        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Individual plantation not found'
            });
        }

        // Delete associated land ownership
        await LandOwnership.findByIdAndDelete(plantation.landOwnership);

        // Delete the plantation
        await IndividualPlantation.findByIdAndDelete(req.params.id);

        res.status(200).json({
            status: 'success',
            message: 'Individual plantation and associated records deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Verify individual plantation
exports.verifyIndividualPlantation = async (req, res) => {
    try {
        const { status, comments } = req.body;
        
        const plantation = await IndividualPlantation.findByIdAndUpdate(
            req.params.id,
            {
                status,
                verificationComments: comments,
                verifiedBy: req.user._id,
                verificationDate: Date.now()
            },
            { new: true, runValidators: true }
        ).populate('state district village gramPanchayat landOwnership createdBy verifiedBy');

        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Individual plantation not found'
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