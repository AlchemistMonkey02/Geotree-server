const Plantation = require('../models/plantationModel');
const Activity = require('../models/activityModel');
const User = require('../models/userModel');
const BlockPlantation = require('../models/blockPlantationModel');
const IndividualPlantation = require('../models/plantationModel');
const Event = require('../models/eventModel');
const Campaign = require('../models/campaignModel');
const TreeCategory = require('../models/treeCategoryModel');
const { deleteFile } = require('../utils/fileUtils');
const mongoose = require('mongoose');

// ✅ Utility function to check if user is registered
const checkUserRegistered = async (userMobile) => {
    try {
        return await User.findOne({ phone: userMobile });
    } catch (error) {
        console.error('Error checking user:', error);
        return null;
    }
};

// 📌 Create a new Plantation Entry
exports.createPlantation = async (req, res) => {
    try {
        console.log('📥 Raw request body:', req.body);
        console.log('📸 Received files:', req.files);

        let {
            userMobile, userName, plantName, height, event, areaType, userIp,
            userLocation, latitude, longitude, district, gpName, categoryId,
            campaignId, eventId
        } = req.body;

        // ✅ Validate required fields
        if (!userMobile || !userName || !plantName || !height || !event || !areaType) {
            return res.status(400).json({ message: "Required fields are missing!" });
        }

        // ✅ Validate ObjectIDs
        categoryId = categoryId && mongoose.Types.ObjectId.isValid(categoryId) ? new mongoose.Types.ObjectId(categoryId) : null;
        campaignId = campaignId && mongoose.Types.ObjectId.isValid(campaignId) ? new mongoose.Types.ObjectId(campaignId) : null;
        eventId = eventId && mongoose.Types.ObjectId.isValid(eventId) ? new mongoose.Types.ObjectId(eventId) : null;

        // ✅ Check if user is registered
        const user = await checkUserRegistered(userMobile);
        if (!user) {
            return res.status(404).json({ message: 'User not found. Please register first.' });
        }

        // ✅ Validate `eventId`, `campaignId`, and `categoryId`
        if (eventId && !(await Event.findById(eventId))) {
            return res.status(400).json({ message: `Event not found with ID: ${eventId}` });
        }
        if (campaignId && !(await Campaign.findById(campaignId))) {
            return res.status(400).json({ message: `Campaign not found with ID: ${campaignId}` });
        }
        if (!(await TreeCategory.findById(categoryId))) {
            return res.status(400).json({ message: `Tree category not found with ID: ${categoryId}` });
        }

        // ✅ Validate image uploads
        if (!req.files || !req.files.prePlantationImage || !req.files.plantationImage) {
            return res.status(400).json({ message: 'Both prePlantationImage and plantationImage are required!' });
        }

        const prePlantationImage = req.files.prePlantationImage?.[0];
        const plantationImage = req.files.plantationImage?.[0];

        // ✅ Create new Plantation Entry
        const newEntry = new Plantation({
            userId: user._id,
            plantName,
            height: parseFloat(height),
            event: eventId,
            areaType,
            userIp,
            userLocation,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            district,
            gpName,
            categoryId,
            campaignId,
            prePlantationImage,
            plantationImage
        });

        await newEntry.save();

        // ✅ Create User Activity Log
        const newActivity = new Activity({
            userId: user._id,
            plantName,
            event: eventId,
            areaType,
            userName,
            userMobile,
            categoryId,
            height: parseFloat(height),
            location: {
                type: "Point",
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            prePlantationImage,
            plantationImage
        });

        await newActivity.save();

        res.status(201).json({
            message: '✅ Data and images uploaded successfully!',
            plantation: newEntry,
            activity: newActivity
        });

    } catch (error) {
        console.error('❌ Error processing request:', error);
        res.status(500).json({ message: 'Error processing request', error: error.message });
    }
};

// 📌 Get Plantation Counts
exports.getPlantationCount = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.userId);

        // ✅ Optimized Count Queries using Aggregation
        const [blockPlantationCount, individualPlantationCount] = await Promise.all([
            BlockPlantation.countDocuments({ createdBy: userId }),
            IndividualPlantation.countDocuments({ createdBy: userId })
        ]);

        res.status(200).json({
            message: '✅ Plantation counts retrieved successfully',
            blockPlantationCount,
            individualPlantationCount,
        });
    } catch (error) {
        console.error('❌ Error fetching plantation counts:', error);
        res.status(500).json({ message: 'Error fetching plantation counts', error: error.message });
    }
};

