const BlockPlantation = require('../models/blockPlantationModel');
const IndividualPlantation = require('../models/individualPlantationModel');
const mongoose = require('mongoose');

// Get combined plantations with advanced filtering
exports.getCombinedPlantations = async (req, res) => {
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
            
            // Status filter
            status,
            
            // Tree filters
            treeSpecies,
            treeType,
            
            // Sorting
            sortBy = 'createdAt',
            sortOrder = 'desc',
            
            // Plantation type filter
            plantationType, // 'block', 'individual', or undefined for both
            
            // Geospatial
            near,
            maxDistance = 10000 // Default 10km
        } = req.query;

        // Build filter objects for both plantation types
        const blockFilter = {};
        const individualFilter = {};
        
        // User filters
        if (userId) {
            blockFilter.userId = userId;
            individualFilter.userId = userId;
        }
        if (organizationType) {
            blockFilter.organizationType = organizationType;
        }
        
        // Event filters
        if (eventId) {
            blockFilter.eventId = eventId;
            individualFilter.eventId = eventId;
        }
        if (campaignId) {
            blockFilter.campaignId = campaignId;
            individualFilter.campaignId = campaignId;
        }
        
        // Location filters - using regex for partial matches
        if (country) {
            blockFilter.country = new RegExp(country, 'i');
            individualFilter.country = new RegExp(country, 'i');
        }
        if (state) {
            blockFilter.state = new RegExp(state, 'i');
            individualFilter.state = new RegExp(state, 'i');
        }
        if (district) {
            blockFilter.district = new RegExp(district, 'i');
            individualFilter.district = new RegExp(district, 'i');
        }
        if (block) {
            blockFilter.block = new RegExp(block, 'i');
            individualFilter.block = new RegExp(block, 'i');
        }
        if (gramPanchayat) {
            blockFilter.gramPanchayat = new RegExp(gramPanchayat, 'i');
            individualFilter.gramPanchayat = new RegExp(gramPanchayat, 'i');
        }
        if (village) {
            blockFilter.village = new RegExp(village, 'i');
            individualFilter.village = new RegExp(village, 'i');
        }
        
        // Date range filter
        if (startDate || endDate) {
            blockFilter.plantationDate = {};
            individualFilter.plantationDate = {};
            
            if (startDate) {
                blockFilter.plantationDate.$gte = new Date(startDate);
                individualFilter.plantationDate.$gte = new Date(startDate);
            }
            if (endDate) {
                blockFilter.plantationDate.$lte = new Date(endDate);
                individualFilter.plantationDate.$lte = new Date(endDate);
            }
        }
        
        // Status filter
        if (status) {
            blockFilter.status = status;
            individualFilter.status = status;
        }
        
        // Tree species/type filter
        if (treeSpecies) {
            blockFilter['treeSpecies.name'] = new RegExp(treeSpecies, 'i');
        }
        if (treeType) {
            individualFilter.treeType = new RegExp(treeType, 'i');
        }
        
        // Geospatial query - near a point
        if (near) {
            const [longitude, latitude] = near.split(',').map(coord => parseFloat(coord));
            const nearFilter = {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: parseInt(maxDistance)
                }
            };
            
            blockFilter.location = nearFilter;
            individualFilter.location = nearFilter;
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Prepare sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        // Determine which plantation types to query based on plantationType parameter
        let blockPlantations = [];
        let individualPlantations = [];
        let blockCount = 0;
        let individualCount = 0;
        
        // Execute queries based on plantationType filter
        if (!plantationType || plantationType === 'block') {
            blockPlantations = await BlockPlantation.find(blockFilter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email')
                .lean();
                
            blockCount = await BlockPlantation.countDocuments(blockFilter);
            
            // Add type field to distinguish in combined results
            blockPlantations = blockPlantations.map(plantation => ({
                ...plantation,
                plantationType: 'block'
            }));
        }
        
        if (!plantationType || plantationType === 'individual') {
            individualPlantations = await IndividualPlantation.find(individualFilter)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email')
                .lean();
                
            individualCount = await IndividualPlantation.countDocuments(individualFilter);
            
            // Add type field to distinguish in combined results
            individualPlantations = individualPlantations.map(plantation => ({
                ...plantation,
                plantationType: 'individual'
            }));
        }
        
        // Combine results
        let combinedPlantations = [...blockPlantations, ...individualPlantations];
        
        // Sort combined results
        if (sortBy === 'createdAt') {
            combinedPlantations.sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
        }
        
        // Apply limit to combined results
        combinedPlantations = combinedPlantations.slice(0, parseInt(limit));
        
        // Calculate total count and pagination metadata
        const totalCount = blockCount + individualCount;
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        res.status(200).json({
            status: 'success',
            results: combinedPlantations.length,
            pagination: {
                totalCount,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage,
                hasPrevPage,
                blockCount,
                individualCount
            },
            data: combinedPlantations
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get combined dashboard statistics
exports.getCombinedDashboardStatistics = async (req, res) => {
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

        // Build filter objects for both plantation types
        const blockFilter = {};
        const individualFilter = {};
        
        // User filters
        if (userId) {
            blockFilter.userId = userId;
            individualFilter.userId = userId;
        }
        if (organizationType) {
            blockFilter.organizationType = organizationType;
        }
        
        // Location filters
        if (country) {
            blockFilter.country = new RegExp(country, 'i');
            individualFilter.country = new RegExp(country, 'i');
        }
        if (state) {
            blockFilter.state = new RegExp(state, 'i');
            individualFilter.state = new RegExp(state, 'i');
        }
        if (district) {
            blockFilter.district = new RegExp(district, 'i');
            individualFilter.district = new RegExp(district, 'i');
        }
        if (block) {
            blockFilter.block = new RegExp(block, 'i');
            individualFilter.block = new RegExp(block, 'i');
        }
        if (gramPanchayat) {
            blockFilter.gramPanchayat = new RegExp(gramPanchayat, 'i');
            individualFilter.gramPanchayat = new RegExp(gramPanchayat, 'i');
        }
        if (village) {
            blockFilter.village = new RegExp(village, 'i');
            individualFilter.village = new RegExp(village, 'i');
        }
        
        // Date range filter
        if (startDate || endDate) {
            blockFilter.plantationDate = {};
            individualFilter.plantationDate = {};
            
            if (startDate) {
                blockFilter.plantationDate.$gte = new Date(startDate);
                individualFilter.plantationDate.$gte = new Date(startDate);
            }
            if (endDate) {
                blockFilter.plantationDate.$lte = new Date(endDate);
                individualFilter.plantationDate.$lte = new Date(endDate);
            }
        }
        
        // Status filter
        if (status) {
            blockFilter.status = status;
            individualFilter.status = status;
        }
        
        // Get block plantation statistics
        const blockStatistics = await BlockPlantation.aggregate([
            { $match: blockFilter },
            { $group: {
                _id: null,
                totalPlantations: { $sum: 1 },
                totalTrees: { $sum: '$numberOfTrees' },
                totalArea: { $sum: '$plantationArea.value' },
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
                verifiedCount: 1,
                pendingCount: 1,
                rejectedCount: 1
            }}
        ]);
        
        // Get individual plantation statistics
        const individualStatistics = await IndividualPlantation.aggregate([
            { $match: individualFilter },
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
        
        // Get location distribution for both types
        const blockLocationDistribution = await BlockPlantation.aggregate([
            { $match: blockFilter },
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
                trees: 1,
                type: { $literal: 'block' }
            }}
        ]);
        
        const individualLocationDistribution = await IndividualPlantation.aggregate([
            { $match: individualFilter },
            { $group: {
                _id: '$state',
                count: { $sum: 1 }
            }},
            { $sort: { count: -1 } },
            { $project: {
                _id: 0,
                state: '$_id',
                count: 1,
                trees: { $literal: 1 }, // Each individual plantation is 1 tree
                type: { $literal: 'individual' }
            }}
        ]);
        
        // Combine location distributions
        const locationDistribution = [...blockLocationDistribution, ...individualLocationDistribution];
        
        // Get monthly trend for both types
        const blockMonthlyTrend = await BlockPlantation.aggregate([
            { $match: blockFilter },
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
                trees: 1,
                type: { $literal: 'block' }
            }}
        ]);
        
        const individualMonthlyTrend = await IndividualPlantation.aggregate([
            { $match: individualFilter },
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
                count: 1,
                trees: '$count', // Each individual plantation is 1 tree
                type: { $literal: 'individual' }
            }}
        ]);
        
        // Combine monthly trends
        const monthlyTrend = [...blockMonthlyTrend, ...individualMonthlyTrend];
        
        // Combine statistics
        const blockStats = blockStatistics.length > 0 ? blockStatistics[0] : {
            totalPlantations: 0,
            totalTrees: 0,
            totalArea: 0,
            verifiedCount: 0,
            pendingCount: 0,
            rejectedCount: 0
        };
        
        const individualStats = individualStatistics.length > 0 ? individualStatistics[0] : {
            totalPlantations: 0,
            averageHeight: 0,
            verifiedCount: 0,
            pendingCount: 0,
            rejectedCount: 0
        };
        
        const combinedStats = {
            totalPlantations: blockStats.totalPlantations + individualStats.totalPlantations,
            totalTrees: blockStats.totalTrees + individualStats.totalPlantations, // Each individual plantation is 1 tree
            blockPlantations: blockStats.totalPlantations,
            individualPlantations: individualStats.totalPlantations,
            totalArea: blockStats.totalArea,
            averageHeight: individualStats.averageHeight,
            verifiedCount: blockStats.verifiedCount + individualStats.verifiedCount,
            pendingCount: blockStats.pendingCount + individualStats.pendingCount,
            rejectedCount: blockStats.rejectedCount + individualStats.rejectedCount
        };
        
        res.status(200).json({
            status: 'success',
            data: {
                summary: combinedStats,
                blockStatistics: blockStats,
                individualStatistics: individualStats,
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