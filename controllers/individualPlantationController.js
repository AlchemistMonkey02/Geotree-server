const IndividualPlantation = require('../models/individualPlantationModel');
const LandOwnership = require('../models/landOwnershipModel');
const User = require('../models/userModel'); // Added missing User model import
const { updateIndividualPlantationPoints } = require('./rewardController');


exports.createIndividualPlantation = async (req, res) => {
    try {
        const { contactNumber, email, treeType, height, state, district, village, gramPanchayat, location, plantationDate, landOwnership } = req.body;

        // Check if user exists, if not, register them
        let user = await User.findOne({ phone: contactNumber });
        if (!user) {
            user = new User({ phone: contactNumber, email });
            await user.save();
        }

        // Create land ownership record
        const landOwnershipData = new LandOwnership({
            ownershipType: landOwnership.ownershipType,
            ownerName: landOwnership.ownerName,
            landArea: landOwnership.landArea,
            boundaries: landOwnership.boundaries,
            landUseType: landOwnership.landUseType
        });
        await landOwnershipData.save();

        // Create plantation with land ownership reference
        const plantationData = {
            treeType,
            height,
            state,
            district,
            village,
            gramPanchayat,
            landOwnership: landOwnershipData._id,
            location,
            plantationDate,
            contactNumber,
            email,
            createdBy: user._id
        };

        // Handle file uploads if present
        if (req.files && req.files.length > 0) {
            plantationData.photos = req.files.map(file => ({
                url: file.path,
                caption: file.originalname
            }));
        }

        // Validate plantation location is within land boundaries
        const isWithinBoundaries = await LandOwnership.findOne({
            _id: landOwnershipData._id,
            boundaries: {
                $geoIntersects: {
                    $geometry: location
                }
            }
        });

        if (!isWithinBoundaries) {
            throw new Error('Plantation location must be within the specified land boundaries');
        }

        // Save plantation
        const plantation = new IndividualPlantation(plantationData);
        await plantation.save();

        // Update reward points
        await updateIndividualPlantationPoints(plantation._id);

        return res.status(201).json({
            status: 'success',
            data: {
                plantation,
                landOwnership: landOwnershipData
            }
        });

    } catch (error) {
        return res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};


// Get all individual plantations with advanced filtering
exports.getAllIndividualPlantations = async (req, res) => {
    try {
        // Extract all filter parameters from query
        const {
            // Pagination
            page = 1,
            limit = 10,
            
            // User filters
            userId,
            
            // Tree filters
            treeType,
            minHeight,
            maxHeight,
            
            // Location filters
            country,
            state,
            district,
            block,
            gramPanchayat,
            village,

            
            // Date filters
            startDate,
            endDate,
            
            // Status filter
            status,
            
            // Sorting
            sortBy = 'createdAt',
            sortOrder = 'desc',
            
            // Geospatial
            near,
            maxDistance = 10000 // Default 10km
        } = req.query;

        // Build filter object
        const filter = {};
        
        // User filter
        if (userId) filter.userId = userId;
        
        // Tree filters
        if (treeType) filter.treeType = new RegExp(treeType, 'i');
        if (minHeight || maxHeight) {
            filter.height = {};
            if (minHeight) filter.height.$gte = parseFloat(minHeight);
            if (maxHeight) filter.height.$lte = parseFloat(maxHeight);
        }
        
        // Location filters - using regex for partial matches
        if (country) filter.country = new RegExp(country, 'i');
        if (state) filter.state = new RegExp(state, 'i');
        if (district) filter.district = new RegExp(district, 'i');
        if (block) filter.block = new RegExp(block, 'i');
        if (gramPanchayat) filter.gramPanchayat = new RegExp(gramPanchayat, 'i');
        if (village) filter.village = new RegExp(village, 'i');
        
        
        // Date range filter
        if (startDate || endDate) {
            filter.plantationDate = {};
            if (startDate) filter.plantationDate.$gte = new Date(startDate);
            if (endDate) filter.plantationDate.$lte = new Date(endDate);
        }
        
        // Status filter
        if (status) filter.status = status;
        
        // Geospatial query - near a point
        if (near) {
            const [longitude, latitude] = near.split(',').map(coord => parseFloat(coord));
            filter.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            };
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Prepare sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Execute query with pagination
        const plantations = await IndividualPlantation.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'name email')
            .populate('landOwnership');
        
        // Get total count for pagination
        const totalCount = await IndividualPlantation.countDocuments(filter);
        
        // Calculate pagination metadata
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        res.status(200).json({
            status: 'success',
            results: plantations.length,
            pagination: {
                totalCount,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage,
                hasPrevPage
            },
            data: plantations
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

        // Update reward points after updating the plantation
        await updateIndividualPlantationPoints(updatedPlantation._id);

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

        // Update reward points after verifying the plantation
        await updateIndividualPlantationPoints(plantation._id);

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

// Get dashboard statistics for individual plantations
exports.getDashboardStatistics = async (req, res) => {
    try {
        // Extract filter parameters
        const {
            // User filter
            userId,
            
            // Location filters
            country,
            state,
            district,
            block,
            gramPanchayat,
            village,
            
            // Date filters
            startDate,
            endDate,
            
            // Status filter
            status,
            
            // Tree filter
            treeType
        } = req.query;

        // Build filter object
        const filter = {};
        
        // User filter
        if (userId) filter.userId = userId;
        
        // Tree filter
        if (treeType) filter.treeType = new RegExp(treeType, 'i');
        
        // Location filters
        if (country) filter.country = new RegExp(country, 'i');
        if (state) filter.state = new RegExp(state, 'i');
        if (district) filter.district = new RegExp(district, 'i');
        if (block) filter.block = new RegExp(block, 'i');
        if (gramPanchayat) filter.gramPanchayat = new RegExp(gramPanchayat, 'i');
        if (village) filter.village = new RegExp(village, 'i');
        
        // Date range filter
        if (startDate || endDate) {
            filter.plantationDate = {};
            if (startDate) filter.plantationDate.$gte = new Date(startDate);
            if (endDate) filter.plantationDate.$lte = new Date(endDate);
        }
        
        // Status filter
        if (status) filter.status = status;
        
        // Aggregate statistics
        const statistics = await IndividualPlantation.aggregate([
            { $match: filter },
            { $group: {
                _id: null,
                totalPlantations: { $sum: 1 },
                averageHeight: { $avg: '$height' },
                verifiedCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'VERIFIED'] }, 1, 0] }
                },
                pendingCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
                },
                rejectedCount: {
                    $sum: { $cond: [{ $eq: ['$status', 'REJECTED'] }, 1, 0] }
                }
            }},
            { $project: {
                _id: 0,
                totalPlantations: 1,
                averageHeight: { $round: ['$averageHeight', 2] },
                verifiedCount: 1,
                pendingCount: 1,
                rejectedCount: 1
            }}
        ]);
        
        // Get tree type distribution
        const treeTypeDistribution = await IndividualPlantation.aggregate([
            { $match: filter },
            { $group: {
                _id: '$treeType',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: {
                _id: 0,
                treeType: '$_id',
                count: 1
            }}
        ]);
        
        // Get location distribution
        const locationDistribution = await IndividualPlantation.aggregate([
            { $match: filter },
            { $group: {
                _id: '$state',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
            { $project: {
                _id: 0,
                state: '$_id',
                count: 1
            }}
        ]);
        
        // Get monthly trend
        const monthlyTrend = await IndividualPlantation.aggregate([
            { $match: filter },
            { $group: {
                _id: {
                    year: { $year: '$plantationDate' },
                    month: { $month: '$plantationDate' }
                },
                count: { $sum: 1 }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                count: 1
            }}
        ]);
        
        // Get height distribution
        const heightDistribution = await IndividualPlantation.aggregate([
            { $match: filter },
            { $bucket: {
                groupBy: '$height',
                boundaries: [0, 1, 2, 3, 5, 10, 20],
                default: 'Above 20',
                output: {
                    count: { $sum: 1 }
                }
            }},
            { $project: {
                _id: 0,
                heightRange: '$_id',
                count: 1
            }}
        ]);
        
        res.status(200).json({
            status: 'success',
            data: {
                summary: statistics.length > 0 ? statistics[0] : {
                    totalPlantations: 0,
                    averageHeight: 0,
                    verifiedCount: 0,
                    pendingCount: 0,
                    rejectedCount: 0
                },
                treeTypeDistribution,
                locationDistribution,
                monthlyTrend,
                heightDistribution
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Generate KML for individual plantation
exports.downloadKML = async (req, res) => {
    try {
        const plantation = await IndividualPlantation.findById(req.params.id)
            .populate('landOwnership');
        
        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Individual plantation not found'
            });
        }

        const { generateKML } = require('../utils/kmlUtils');
        
        // Adapt plantation data for KML generation
        const kmlData = {
            _id: plantation._id,
            organizationType: 'INDIVIDUAL',
            numberOfTrees: 1,
            plantationArea: {
                value: plantation.landOwnership ? plantation.landOwnership.landArea.value : 0,
                unit: plantation.landOwnership ? plantation.landOwnership.landArea.unit : 'SQMT'
            },
            plantationDate: plantation.plantationDate,
            location: plantation.location,
            boundaries: plantation.landOwnership ? plantation.landOwnership.boundaries : {
                type: 'Polygon',
                coordinates: [[
                    [plantation.location.coordinates[0] - 0.0001, plantation.location.coordinates[1] - 0.0001],
                    [plantation.location.coordinates[0] + 0.0001, plantation.location.coordinates[1] - 0.0001],
                    [plantation.location.coordinates[0] + 0.0001, plantation.location.coordinates[1] + 0.0001],
                    [plantation.location.coordinates[0] - 0.0001, plantation.location.coordinates[1] + 0.0001],
                    [plantation.location.coordinates[0] - 0.0001, plantation.location.coordinates[1] - 0.0001]
                ]]
            },
            treeSpecies: [{
                name: plantation.treeType,
                quantity: 1
            }],
            status: plantation.status
        };
        
        const kmlContent = generateKML(kmlData);
        
        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        res.setHeader('Content-Disposition', `attachment; filename=plantation-${plantation._id}.kml`);
        
        // Send KML content
        res.send(kmlContent);

    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}; 