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
    let { page = 1, limit = 10, event, startDate, endDate, categoryId, campaignId, latMin, latMax, longMin, longMax, sort } = req.query;

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

        // 📌 Apply Filters
        if (event) query.event = new RegExp(event, 'i');
        if (startDate && endDate) query.plantedDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
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

        // 📌 Sorting Options
        if (sort === "oldest") sortOption = { createdAt: 1 };
        if (sort === "height_desc") sortOption = { height: -1 };
        if (sort === "height_asc") sortOption = { height: 1 };

        // Fetch activities from both tables with sorting & pagination
        const [individualActivities, blockActivities, totalIndividual, totalBlock] = await Promise.all([
            IndividualPlantation.find(query)
                .populate('userId', 'firstName lastName city')
                .sort(sortOption)
                .skip((parsedPage - 1) * parsedLimit)
                .limit(parsedLimit),
            
            BlockPlantation.find(query)
                .populate('userId', 'firstName lastName city')
                .sort(sortOption)
                .skip((parsedPage - 1) * parsedLimit)
                .limit(parsedLimit),

            IndividualPlantation.countDocuments(query),
            BlockPlantation.countDocuments(query),
        ]);

        let allActivities = [...individualActivities, ...blockActivities];
        allActivities.sort((a, b) => b.createdAt - a.createdAt); // Ensure correct order

        // 📌 Return Paginated Results
        res.status(200).json({
            activities: allActivities,
            totalActivities: totalIndividual + totalBlock,
            totalPages: Math.ceil((totalIndividual + totalBlock) / parsedLimit),
            currentPage: parsedPage,
            perPage: parsedLimit,
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ message: 'Error fetching activities', error: error.message });
    }
};

// 📌 Create Block Plantation
exports.createBlockPlantation = async (req, res) => {
    try {
        console.log("📥 Received Body:", req.body);
        console.log("📸 Received Files:", req.files);

        // ✅ Validate Image Uploads
        if (!req.files || !req.files.prePlantationImage || !req.files.plantationImage) {
            return res.status(400).json({ 
                success: false,
                message: 'Both prePlantationImage and plantationImage are required!' 
            });
        }

        // ✅ Extract required fields from request body
        const {
            plantationType, areaType, area, location, boundaryPoints, userMobile, userName, plantName,
            height, event, userIp, userLocation, latitude, longitude, district, gpName,
            eventId, campaignId, categoryId
        } = req.body;

        const requiredFields = [
            'plantationType', 'areaType', 'area', 'location', 'boundaryPoints', 'userMobile', 'userName',
            'plantName', 'height', 'event', 'userIp', 'userLocation', 'latitude', 'longitude',
            'district', 'gpName', 'categoryId'
        ];

        // ✅ Check for missing fields
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: `Missing fields: ${missingFields.join(', ')}` 
            });
        }

        // ✅ Check if user is registered
        const user = await checkUserRegistered(userMobile);
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'User not registered! Please register first.' 
            });
        }

        // ✅ Parse `location` and `boundaryPoints`
        let parsedLocation, parsedBoundaryPoints;
        try {
            parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
            parsedBoundaryPoints = typeof boundaryPoints === 'string' ? JSON.parse(boundaryPoints) : boundaryPoints;
        } catch (error) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid JSON format in location or boundaryPoints!', 
                error: error.message 
            });
        }

        // ✅ Validate Plantation Type
        const allowedPlantationTypes = ['Teak', 'Bamboo', 'Neem', 'Mahogany'];
        if (!allowedPlantationTypes.includes(plantationType)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid plantation type!' 
            });
        }

        // ✅ Validate `eventId`, `campaignId`, and `categoryId`
        if (eventId && !(await Event.findById(eventId))) {
            return res.status(400).json({ 
                success: false,
                message: `Event not found with ID: ${eventId}` 
            });
        }
        if (campaignId && !(await Campaign.findById(campaignId))) {
            return res.status(400).json({ 
                success: false,
                message: `Campaign not found with ID: ${campaignId}` 
            });
        }
        if (!(await TreeCategory.findById(categoryId))) {
            return res.status(400).json({ 
                success: false,
                message: `Tree category not found with ID: ${categoryId}` 
            });
        }

        // ✅ Create new Plantation Entry
        const newPlantation = new BlockPlantation({
            userId: user._id,
            plantationType,
            areaType,
            area: parseFloat(area),
            location: parsedLocation,
            boundaryPoints: parsedBoundaryPoints,
            prePlantationImage: {
                filename: req.files.prePlantationImage[0].filename,
                path: req.files.prePlantationImage[0].path,
                mimetype: req.files.prePlantationImage[0].mimetype,
                size: req.files.prePlantationImage[0].size
            },
            plantationImage: {
                filename: req.files.plantationImage[0].filename,
                path: req.files.plantationImage[0].path,
                mimetype: req.files.plantationImage[0].mimetype,
                size: req.files.plantationImage[0].size
            },
            userMobile,
            userName,
            plantName,
            height: parseFloat(height),
            event,
            userIp,
            userLocation,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            district,
            gpName,
            categoryId,
            campaignId: campaignId || null,
            eventId: eventId || null,
            createdBy: user._id
        });

        await newPlantation.save();

        // ✅ Create Activity Log
        const activity = new Activity({
            userId: user._id,
            plantName,
            height: parseFloat(height),
            areaType,
            event,
            area: parseFloat(area),
            userName,
            userMobile,
            prePlantationImage: req.files.prePlantationImage[0].path,
            plantationImage: req.files.plantationImage[0].path,
            location: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            categoryId,
            eventId: eventId || null,
            campaignId: campaignId || null
        });

        await activity.save();

        res.status(201).json({
            success: true,
            message: 'Block plantation created successfully',
            data: {
                plantation: newPlantation,
                activity
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
