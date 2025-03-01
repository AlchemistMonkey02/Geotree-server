const mongoose = require('mongoose');
const Activity = require('../models/activityModel');
const User = require('../models/userModel');
const IndividualPlantation = require('../models/individualPlantationModel');
const BlockPlantation = require('../models/blockPlantationModel');
const Event = require('../models/eventModel');
const Campaign = require('../models/campaignModel');
const TreeCategory = require('../models/treeCategoryModel');

const fs = require('fs');
const path = require('path');
const exceljs = require('exceljs');
const { stringify } = require('fast-csv');

// 📌 Helper function to check if user is registered
const checkUserRegistered = async (mobile) => {
    const user = await User.findOne({ mobile });
    return user;
};

// 📌 Export Activities to CSV/Excel
exports.exportActivities = async (req, res) => {
    try {
        const { format } = req.query;
        if (!format || !['csv', 'excel'].includes(format)) {
            return res.status(400).json({ message: 'Invalid format. Use csv or excel.' });
        }

        const activities = await Activity.find()
            .populate('userId', 'firstName lastName email')
            .lean();

        if (format === 'csv') {
            const csvStream = stringify({ headers: true });
            res.setHeader('Content-Disposition', 'attachment; filename=activities.csv');
            res.setHeader('Content-Type', 'text/csv');
            activities.forEach(activity => csvStream.write(activity));
            csvStream.pipe(res);
        } else if (format === 'excel') {
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('Activities');
            worksheet.columns = Object.keys(activities[0] || {}).map(key => ({ header: key, key }));

            activities.forEach(activity => worksheet.addRow(activity));

            res.setHeader('Content-Disposition', 'attachment; filename=activities.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            await workbook.xlsx.write(res);
            res.end();
        }
    } catch (error) {
        console.error('Error exporting activities:', error);
        res.status(500).json({ message: 'Error exporting activities', error: error.message });
    }
};

// 📌 Get all activities with pagination
exports.getAllActivities = async (req, res) => {
    let { 
        page = 1, 
        limit = 10, 
        event, 
        startDate, 
        endDate, 
        categoryId, 
        campaignId, 
        latMin, 
        latMax, 
        longMin, 
        longMax, 
        sort,
        plantationType // Added to filter by plantation type
    } = req.query;

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    let query = {};
    let sortOption = { createdAt: -1 }; // Default: Newest first

    try {
        // 🛑 Role-based Access: Admins see their city's users, Superadmins see all
        if (req.user.role === 'admin') {
            const admin = await User.findById(req.user.id);
            if (!admin) return res.status(404).json({ message: 'Admin not found' });

            const cityUsers = await User.find({ city: admin.city }).select('_id');
            query.userId = { $in: cityUsers.map(user => user._id) };
        } else if (req.user.role !== 'superadmin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // 📌 Apply Common Filters
        if (event) query.event = new RegExp(event, 'i');
        if (startDate && endDate) {
            query.createdAt = { 
                $gte: new Date(startDate), 
                $lte: new Date(endDate) 
            };
        }
        if (categoryId) query.categoryId = categoryId;
        if (campaignId) query.campaignId = campaignId;

        // 📌 Apply Location Range Filter
        if (latMin && latMax && longMin && longMax) {
            query["location.coordinates"] = {
                $geoWithin: {
                    $box: [
                        [parseFloat(longMin), parseFloat(latMin)],
                        [parseFloat(longMax), parseFloat(latMax)]
                    ]
                }
            };
        }

        // 📌 Apply Sorting
        switch(sort) {
            case "oldest":
                sortOption = { createdAt: 1 };
                break;
            case "height_desc":
                sortOption = { height: -1 };
                break;
            case "height_asc":
                sortOption = { height: 1 };
                break;
            default:
                sortOption = { createdAt: -1 };
        }

        // 📌 Calculate skip value for pagination
        const skip = (parsedPage - 1) * parsedLimit;

        // 📌 Aggregate Pipeline for Both Collections
        const aggregatePipeline = [
            { $match: query },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: '$userDetails' },
            {
                $project: {
                    _id: 1,
                    plantationType: 1,
                    plantName: 1,
                    height: 1,
                    area: 1,
                    location: 1,
                    createdAt: 1,
                    event: 1,
                    categoryId: 1,
                    campaignId: 1,
                    plantationImage: 1,
                    prePlantationImage: 1,
                    userName: '$userDetails.firstName',
                    userLastName: '$userDetails.lastName',
                    userCity: '$userDetails.city',
                    plantationType: {
                        $cond: {
                            if: { $eq: ['$collectionType', 'individual'] },
                            then: 'Individual',
                            else: 'Block'
                        }
                    }
                }
            },
            { $sort: sortOption }
        ];

        // 📌 Execute Queries for Both Collections
        const [individualResults, blockResults] = await Promise.all([
            IndividualPlantation.aggregate([
                {
                    $addFields: {
                        collectionType: 'individual'
                    }
                },
                ...aggregatePipeline
            ]),
            BlockPlantation.aggregate([
                {
                    $addFields: {
                        collectionType: 'block'
                    }
                },
                ...aggregatePipeline
            ])
        ]);

        // 📌 Combine and Sort Results
        let allActivities = [...individualResults, ...blockResults]
            .sort((a, b) => {
                // Apply the same sorting as specified in sortOption
                if (sort === 'oldest') return a.createdAt - b.createdAt;
                if (sort === 'height_desc') return b.height - a.height;
                if (sort === 'height_asc') return a.height - b.height;
                return b.createdAt - a.createdAt; // default newest first
            });

        // 📌 Apply Plantation Type Filter if specified
        if (plantationType) {
            allActivities = allActivities.filter(activity => 
                activity.plantationType.toLowerCase() === plantationType.toLowerCase()
            );
        }

        // 📌 Calculate Total Count
        const totalActivities = allActivities.length;

        // 📌 Apply Pagination
        const paginatedActivities = allActivities.slice(skip, skip + parsedLimit);

        // 📌 Return Paginated Results with Enhanced Metadata
        res.status(200).json({
            success: true,
            data: {
                activities: paginatedActivities,
                pagination: {
                    totalActivities,
                    totalPages: Math.ceil(totalActivities / parsedLimit),
                    currentPage: parsedPage,
                    perPage: parsedLimit,
                    hasNextPage: skip + parsedLimit < totalActivities,
                    hasPreviousPage: parsedPage > 1
                },
                summary: {
                    individualCount: individualResults.length,
                    blockCount: blockResults.length,
                    totalCount: totalActivities
                }
            }
        });

    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching activities', 
            error: error.message 
        });
    }
};

// 📌 Create Block Plantation
exports.createBlockPlantation = async (req, res) => {
    try {
        // ✅ 1. Validate Request Body and Files
        const validationResult = await validatePlantationRequest(req);
        if (!validationResult.isValid) {
            return res.status(400).json({
                success: false,
                message: validationResult.message,
                errors: validationResult.errors
            });
        }

        const {
            plantationType,
            areaType,
            area,
            location,
            boundaryPoints,
            userMobile,
            userName,
            plantName,
            height,
            event,
            userIp,
            userLocation,
            latitude,
            longitude,
            district,
            gpName,
            eventId,
            campaignId,
            categoryId,
            numberOfTrees, // Added field for number of trees
            soilType,     // Added field for soil type
            waterSource,  // Added field for water source
            remarks      // Added field for additional remarks
        } = req.body;

        // ✅ 2. Process and Validate Location Data
        const locationData = await processLocationData(location, boundaryPoints, latitude, longitude);
        if (!locationData.success) {
            return res.status(400).json({
                success: false,
                message: 'Invalid location data',
                errors: locationData.errors
            });
        }

        // ✅ 3. Validate User and Get User Details
        const user = await User.findOne({ mobile: userMobile });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not registered! Please register first.'
            });
        }

        // ✅ 4. Validate References (Event, Campaign, Category)
        const validationErrors = await validateReferences(eventId, campaignId, categoryId);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Reference validation failed',
                errors: validationErrors
            });
        }

        // ✅ 5. Process Images
        const imageProcessingResult = await processPlantationImages(req.files);
        if (!imageProcessingResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Image processing failed',
                errors: imageProcessingResult.errors
            });
        }

        // ✅ 6. Create Block Plantation Entry
        const blockPlantation = new BlockPlantation({
            userId: user._id,
            plantationType,
            areaType,
            area: parseFloat(area),
            location: locationData.processedLocation,
            boundaryPoints: locationData.processedBoundaryPoints,
            prePlantationImage: imageProcessingResult.prePlantationImage,
            plantationImage: imageProcessingResult.plantationImage,
            userMobile,
            userName,
            plantName,
            height: parseFloat(height),
            event,
            userIp,
            userLocation,
            district,
            gpName,
            categoryId,
            campaignId: campaignId || null,
            eventId: eventId || null,
            numberOfTrees: parseInt(numberOfTrees) || 0,
            soilType: soilType || 'Not Specified',
            waterSource: waterSource || 'Not Specified',
            remarks: remarks || '',
            status: 'active',
            createdBy: user._id,
            metadata: {
                deviceInfo: req.headers['user-agent'],
                ipAddress: req.ip,
                timestamp: new Date()
            }
        });

        await blockPlantation.save();

        // ✅ 7. Create Activity Log
        const activity = new Activity({
            userId: user._id,
            activityType: 'BLOCK_PLANTATION',
            details: {
                plantationId: blockPlantation._id,
                plantName,
                area: parseFloat(area),
                numberOfTrees: parseInt(numberOfTrees) || 0,
                location: locationData.processedLocation
            },
            metadata: {
                eventId: eventId || null,
                campaignId: campaignId || null,
                categoryId
            }
        });

        await activity.save();

        // ✅ 8. Update User Statistics
        await User.findByIdAndUpdate(user._id, {
            $inc: {
                'statistics.totalPlantations': 1,
                'statistics.totalTrees': parseInt(numberOfTrees) || 0,
                'statistics.totalArea': parseFloat(area)
            }
        });

        // ✅ 9. Send Success Response
        res.status(201).json({
            success: true,
            message: 'Block plantation created successfully',
            data: {
                plantation: blockPlantation,
                activity: activity
            }
        });

    } catch (error) {
        console.error('❌ Error creating block plantation:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating block plantation',
            error: error.message
        });
    }
};

// Helper Functions

async function validatePlantationRequest(req) {
    const requiredFields = [
        'plantationType',
        'areaType',
        'area',
        'location',
        'boundaryPoints',
        'userMobile',
        'userName',
        'plantName',
        'height',
        'event',
        'userIp',
        'userLocation',
        'latitude',
        'longitude',
        'district',
        'gpName',
        'categoryId'
    ];

    const errors = [];

    // Check required fields
    for (const field of requiredFields) {
        if (!req.body[field]) {
            errors.push(`${field} is required`);
        }
    }

    // Validate files
    if (!req.files?.prePlantationImage?.[0] || !req.files?.plantationImage?.[0]) {
        errors.push('Both pre-plantation and plantation images are required');
    }

    // Validate numeric fields
    if (isNaN(parseFloat(req.body.area)) || parseFloat(req.body.area) <= 0) {
        errors.push('Area must be a positive number');
    }
    if (isNaN(parseFloat(req.body.height)) || parseFloat(req.body.height) <= 0) {
        errors.push('Height must be a positive number');
    }

    return {
        isValid: errors.length === 0,
        message: errors.length > 0 ? 'Validation failed' : 'Validation successful',
        errors
    };
}

async function processLocationData(location, boundaryPoints, latitude, longitude) {
    try {
        const processedLocation = {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };

        let processedBoundaryPoints;
        try {
            processedBoundaryPoints = typeof boundaryPoints === 'string' 
                ? JSON.parse(boundaryPoints) 
                : boundaryPoints;
        } catch (error) {
            return {
                success: false,
                errors: ['Invalid boundary points format']
            };
        }

        // Validate coordinates
        if (!isValidCoordinates(latitude, longitude)) {
            return {
                success: false,
                errors: ['Invalid coordinates']
            };
        }

        return {
            success: true,
            processedLocation,
            processedBoundaryPoints
        };
    } catch (error) {
        return {
            success: false,
            errors: ['Error processing location data']
        };
    }
}

async function validateReferences(eventId, campaignId, categoryId) {
    const errors = [];

    if (eventId) {
        const event = await Event.findById(eventId);
        if (!event) errors.push(`Event not found with ID: ${eventId}`);
    }

    if (campaignId) {
        const campaign = await Campaign.findById(campaignId);
        if (!campaign) errors.push(`Campaign not found with ID: ${campaignId}`);
    }

    if (categoryId) {
        const category = await TreeCategory.findById(categoryId);
        if (!category) errors.push(`Tree category not found with ID: ${categoryId}`);
    }

    return errors;
}

async function processPlantationImages(files) {
    if (!files?.prePlantationImage?.[0] || !files?.plantationImage?.[0]) {
        return {
            success: false,
            errors: ['Missing required images']
        };
    }

    return {
        success: true,
        prePlantationImage: {
            filename: files.prePlantationImage[0].filename,
            path: files.prePlantationImage[0].path,
            mimetype: files.prePlantationImage[0].mimetype,
            size: files.prePlantationImage[0].size
        },
        plantationImage: {
            filename: files.plantationImage[0].filename,
            path: files.plantationImage[0].path,
            mimetype: files.plantationImage[0].mimetype,
            size: files.plantationImage[0].size
        }
    };
}

function isValidCoordinates(latitude, longitude) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180;
}

exports.getActivityAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        // 📌 Get total plantations count
        const totalPlantations = await Activity.countDocuments(dateFilter);

        // 📌 Get top 5 planted trees
        const topTrees = await Activity.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$plantName", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 📌 Get top 5 users who planted the most trees
        const userContributions = await Activity.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$userId", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // 📌 Populate user details in contributions
        const userIds = userContributions.map(user => user._id);
        const users = await User.find({ _id: { $in: userIds } }, "firstName lastName");

        // 📌 Attach user details
        const formattedUserContributions = userContributions.map(user => {
            const userInfo = users.find(u => u._id.toString() === user._id.toString());
            return {
                userId: user._id,
                name: userInfo ? `${userInfo.firstName} ${userInfo.lastName}` : "Unknown",
                count: user.count
            };
        });

        res.status(200).json({
            totalPlantations,
            topTrees,
            userContributions: formattedUserContributions
        });
    } catch (error) {
        console.error("Error fetching activity analytics:", error);
        res.status(500).json({ message: "Error fetching activity analytics", error: error.message });
    }
};
