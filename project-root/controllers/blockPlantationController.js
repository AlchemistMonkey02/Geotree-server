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

// 📌 Get all Block Plantations
exports.getAllBlockPlantations = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter object
        const filter = {};
        if (req.query.organizationType) filter.organizationType = req.query.organizationType;
        if (req.query.state) filter.state = req.query.state;
        if (req.query.district) filter.district = req.query.district;
        if (req.query.status) filter.status = req.query.status;

        // Date range filter
        if (req.query.startDate && req.query.endDate) {
            filter.plantationDate = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        // Area range filter
        if (req.query.minArea || req.query.maxArea) {
            filter['plantationArea.value'] = {};
            if (req.query.minArea) filter['plantationArea.value'].$gte = parseFloat(req.query.minArea);
            if (req.query.maxArea) filter['plantationArea.value'].$lte = parseFloat(req.query.maxArea);
        }

        // Geospatial query
        if (req.query.near) {
            const [longitude, latitude] = req.query.near.split(',').map(Number);
            filter.location = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: 10000 // 10km radius
                }
            };
        }

        const [plantations, total] = await Promise.all([
            BlockPlantation.find(filter)
                .populate('state district village gramPanchayat landOwnership createdBy verifiedBy')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            BlockPlantation.countDocuments(filter)
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
