const BlockPlantation = require('../models/blockPlantationModel');
const LandOwnership = require('../models/landOwnershipModel');
const User = require('../models/userModel');
const Activity = require('../models/activityModel');
const { deleteFile } = require('../utils/fileUtils');
const { generateKML } = require('../utils/kmlUtils');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Event = require('../models/eventModel');
const Campaign = require('../models/campaignModel');

// 📌 Ensure upload directory exists
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// 📌 Configure multer for image uploads
const blockPlantationStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/blockplantation/';
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const uploadBlockPlantation = multer({
    storage: blockPlantationStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
}).fields([
    { name: 'prePlantationImage', maxCount: 1 },
    { name: 'plantationImage', maxCount: 1 }
]);

// 📌 Create Block Plantation
exports.createBlockPlantation = async (req, res) => {
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

        // Validate tree species total
        const totalTrees = req.body.treeSpecies.reduce((sum, species) => sum + species.quantity, 0);
        if (totalTrees !== req.body.numberOfTrees) {
            throw new Error('Sum of tree species quantities must match total number of trees');
        }

        // Create plantation with land ownership reference
        const plantationData = {
            organizationType: req.body.organizationType,
            state: req.body.state,
            district: req.body.district,
            village: req.body.village,
            gramPanchayat: req.body.gramPanchayat,
            department: req.body.department,
            ngoName: req.body.ngoName,
            ngoRegistrationNumber: req.body.ngoRegistrationNumber,
            individualName: req.body.individualName,
            contactNumber: req.body.contactNumber,
            email: req.body.email,
            plantationArea: req.body.plantationArea,
            numberOfTrees: req.body.numberOfTrees,
            plantationDate: req.body.plantationDate,
            treeSpecies: req.body.treeSpecies,
            location: req.body.location,
            boundaries: {
                type: 'Polygon',
                coordinates: req.body.boundaries.coordinates
            },
            landOwnership: landOwnership._id,
            createdBy: req.user._id
        };

        // Handle file uploads
        if (req.files && req.files.length > 0) {
            plantationData.photos = req.files.map(file => ({
                url: file.path,
                caption: file.originalname,
                uploadDate: new Date()
            }));
        }

        // Check for overlapping plantations
        const overlappingPlantations = await BlockPlantation.find({
            boundaries: {
                $geoIntersects: {
                    $geometry: {
                        type: 'Polygon',
                        coordinates: req.body.boundaries.coordinates
                    }
                }
            }
        });

        if (overlappingPlantations.length > 0) {
            throw new Error('This area overlaps with existing plantations');
        }

        const plantation = new BlockPlantation(plantationData);
        await plantation.save();

        // Create activity log
        const activity = new Activity({
            type: 'BLOCK_PLANTATION_CREATED',
            userId: req.user._id,
            details: {
                plantationId: plantation._id,
                numberOfTrees: plantation.numberOfTrees,
                area: plantation.plantationArea
            }
        });
        await activity.save();

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

// 📌 Get All Block Plantations with Advanced Filtering
exports.getAllBlockPlantations = async (req, res) => {
    try {
        // Extract all filter parameters from query
        const {
            // Pagination
            page = 1,
            limit = 10,
            
            // User filters
            userId,
            organizationType,
            
            // Event filters
            eventId,
            campaignId,
            
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
            
            // Tree filters
            treeSpecies,
            minTrees,
            maxTrees,
            
            // Area filters
            minArea,
            maxArea,
            
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
        
        // User filters
        if (userId) filter.userId = userId;
        if (organizationType) filter.organizationType = organizationType;
        
        // Event filters
        if (eventId) filter.eventId = eventId;
        if (campaignId) filter.campaignId = campaignId;
        
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
        
        // Tree count range
        if (minTrees || maxTrees) {
            filter.numberOfTrees = {};
            if (minTrees) filter.numberOfTrees.$gte = parseInt(minTrees);
            if (maxTrees) filter.numberOfTrees.$lte = parseInt(maxTrees);
        }
        
        // Area range
        if (minArea || maxArea) {
            filter['plantationArea.value'] = {};
            if (minArea) filter['plantationArea.value'].$gte = parseFloat(minArea);
            if (maxArea) filter['plantationArea.value'].$lte = parseFloat(maxArea);
        }
        
        // Status filter
        if (status) filter.status = status;
        
        // Tree species filter
        if (treeSpecies) {
            filter['treeSpecies.name'] = new RegExp(treeSpecies, 'i');
        }
        
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
        const plantations = await BlockPlantation.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit))
            .populate('userId', 'name email')
            .populate('eventId', 'name description')
            .populate('campaignId', 'name description');
        
        // Get total count for pagination
        const totalCount = await BlockPlantation.countDocuments(filter);
        
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

// 📌 Get plantation statistics
exports.getPlantationStatistics = async (req, res) => {
    try {
        const stats = await BlockPlantation.aggregate([
            {
                $group: {
                    _id: null,
                    totalPlantations: { $sum: 1 },
                    totalTrees: { $sum: '$numberOfTrees' },
                    totalArea: { $sum: '$plantationArea.value' },
                    averageSurvivalRate: {
                        $avg: {
                            $cond: [
                                { $ifNull: ['$surveyDetails.treesSurvived', false] },
                                { $multiply: [
                                    { $divide: ['$surveyDetails.treesSurvived', '$numberOfTrees'] },
                                    100
                                ]},
                                null
                            ]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalPlantations: 1,
                    totalTrees: 1,
                    totalArea: 1,
                    averageSurvivalRate: { $round: ['$averageSurvivalRate', 2] }
                }
            }
        ]);

        const speciesStats = await BlockPlantation.aggregate([
            { $unwind: '$treeSpecies' },
            {
                $group: {
                    _id: '$treeSpecies.name',
                    totalTrees: { $sum: '$treeSpecies.quantity' }
                }
            },
            {
                $project: {
                    species: '$_id',
                    totalTrees: 1,
                    _id: 0
                }
            }
        ]);

        res.status(200).json({
            status: 'success',
            data: {
                overview: stats[0] || {},
                speciesDistribution: speciesStats
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// 📌 Verify plantation
exports.verifyPlantation = async (req, res) => {
    try {
        const { status, comments, surveyDetails } = req.body;
        
        // Handle survey photos if present
        let surveyPhotos = [];
        if (req.files && req.files.length > 0) {
            surveyPhotos = req.files.map(file => ({
                url: file.path,
                caption: file.originalname,
                uploadDate: new Date()
            }));
        }

        const plantation = await BlockPlantation.findByIdAndUpdate(
            req.params.id,
            {
                status,
                verificationComments: comments,
                verifiedBy: req.user._id,
                verificationDate: Date.now(),
                surveyDetails: {
                    ...surveyDetails,
                    lastSurveyDate: Date.now(),
                    surveyPhotos
                }
            },
            { new: true, runValidators: true }
        ).populate('state district village gramPanchayat landOwnership createdBy verifiedBy');

        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Block plantation not found'
            });
        }

        // Create verification activity
        const activity = new Activity({
            type: 'BLOCK_PLANTATION_VERIFIED',
            userId: req.user._id,
            details: {
                plantationId: plantation._id,
                status,
                survivalRate: plantation.survivalRate
            }
        });
        await activity.save();

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

// 📌 Delete Block Plantation
exports.deleteBlockPlantation = async (req, res) => {
    try {
        const plantation = await BlockPlantation.findById(req.params.id);
        
        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Block plantation not found'
            });
        }

        // Delete associated land ownership
        await LandOwnership.findByIdAndDelete(plantation.landOwnership);

        // Delete photos
        if (plantation.photos) {
            plantation.photos.forEach(photo => {
                deleteFile(photo.url);
            });
        }

        // Delete survey photos
        if (plantation.surveyDetails?.surveyPhotos) {
            plantation.surveyDetails.surveyPhotos.forEach(photo => {
                deleteFile(photo.url);
            });
        }

        await BlockPlantation.findByIdAndDelete(req.params.id);

        res.status(200).json({
            status: 'success',
            message: 'Block plantation and associated records deleted successfully'
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// 📌 Download KML
exports.downloadKML = async (req, res) => {
    try {
        const plantation = await BlockPlantation.findById(req.params.id);
        
        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Block plantation not found'
            });
        }

        const kmlContent = generateKML(plantation);
        
        // Set response headers for file download
        res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
        res.setHeader('Content-Disposition', `attachment; filename=plantation-${plantation._id}.kml`);
        
        // Send KML content
        res.send(kmlContent);

        // Log activity
        const activity = new Activity({
            type: 'BLOCK_PLANTATION_KML_DOWNLOADED',
            userId: req.user._id,
            details: {
                plantationId: plantation._id
            }
        });
        await activity.save();

    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// 📌 Update Block Plantation
exports.updateBlockPlantation = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Find the plantation
        const plantation = await BlockPlantation.findById(id);
        if (!plantation) {
            return res.status(404).json({
                status: 'error',
                message: 'Block plantation not found'
            });
        }
        
        // Handle tree species updates
        if (updateData.treeSpecies) {
            // Calculate total trees from species
            const totalTreesFromSpecies = updateData.treeSpecies.reduce(
                (sum, species) => sum + species.quantity, 0
            );
            
            // Ensure total matches numberOfTrees
            if (updateData.numberOfTrees && 
                updateData.numberOfTrees !== totalTreesFromSpecies) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Total number of trees must match sum of tree species quantities'
                });
            }
            
            // If numberOfTrees not provided, update it
            if (!updateData.numberOfTrees) {
                updateData.numberOfTrees = totalTreesFromSpecies;
            }
        }
        
        // Handle boundaries update
        if (updateData.boundaries && updateData.boundaries.coordinates) {
            // Validate that the polygon is closed
            const coordinates = updateData.boundaries.coordinates[0];
            const firstPoint = coordinates[0];
            const lastPoint = coordinates[coordinates.length - 1];
            
            if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Polygon must be closed (first and last points must be the same)'
                });
            }
        }
        
        // Update the plantation
        const updatedPlantation = await BlockPlantation.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );
        
        // Log the activity
        const activity = new Activity({
            type: 'BLOCK_PLANTATION_UPDATED',
            userId: req.user._id,
            details: {
                plantationId: id,
                updates: Object.keys(updateData)
            }
        });
        await activity.save();
        
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

// 📌 Get Dashboard Statistics with Filters
exports.getDashboardStatistics = async (req, res) => {
    try {
        // Extract filter parameters
        const {
            // User filters
            userId,
            organizationType,
            
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
            status
        } = req.query;

        // Build filter object
        const filter = {};
        
        // User filters
        if (userId) filter.userId = userId;
        if (organizationType) filter.organizationType = organizationType;
        
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
        const statistics = await BlockPlantation.aggregate([
            { $match: filter },
            { $group: {
                _id: null,
                totalPlantations: { $sum: 1 },
                totalTrees: { $sum: '$numberOfTrees' },
                totalArea: { $sum: '$plantationArea.value' },
                averageSurvivalRate: { $avg: '$survivalRate' },
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
                totalTrees: 1,
                totalArea: 1,
                averageSurvivalRate: { $round: ['$averageSurvivalRate', 2] },
                verifiedCount: 1,
                pendingCount: 1,
                rejectedCount: 1
            }}
        ]);
        
        // Get tree species distribution
        const treeSpeciesDistribution = await BlockPlantation.aggregate([
            { $match: filter },
            { $unwind: '$treeSpecies' },
            { $group: {
                _id: '$treeSpecies.name',
                count: { $sum: '$treeSpecies.quantity' }
            }},
            { $sort: { count: -1 } },
            { $limit: 10 },
            { $project: {
                _id: 0,
                species: '$_id',
                count: 1
            }}
        ]);
        
        // Get location distribution
        const locationDistribution = await BlockPlantation.aggregate([
            { $match: filter },
            { $group: {
                _id: '$state',
                count: { $sum: 1 },
                trees: { $sum: '$numberOfTrees' }
            }},
            { $sort: { count: -1 } },
            { $project: {
                _id: 0,
                state: '$_id',
                count: 1,
                trees: 1
            }}
        ]);
        
        // Get monthly trend
        const monthlyTrend = await BlockPlantation.aggregate([
            { $match: filter },
            { $group: {
                _id: {
                    year: { $year: '$plantationDate' },
                    month: { $month: '$plantationDate' }
                },
                count: { $sum: 1 },
                trees: { $sum: '$numberOfTrees' }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $project: {
                _id: 0,
                year: '$_id.year',
                month: '$_id.month',
                count: 1,
                trees: 1
            }}
        ]);
        
        res.status(200).json({
            status: 'success',
            data: {
                summary: statistics.length > 0 ? statistics[0] : {
                    totalPlantations: 0,
                    totalTrees: 0,
                    totalArea: 0,
                    averageSurvivalRate: 0,
                    verifiedCount: 0,
                    pendingCount: 0,
                    rejectedCount: 0
                },
                treeSpeciesDistribution,
                locationDistribution,
                monthlyTrend
            }
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};
