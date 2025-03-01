const BlockPlantation = require('../models/blockPlantationModel');
const User = require('../models/userModel'); // ✅ Fixed missing import
const { deleteFile } = require('../utils/fileUtils');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Activity = require('../models/activityModel');
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
        console.log("✅ Received Body:", req.body);
        console.log("📂 Received Files:", req.files);

        // ✅ Validate image uploads
        if (!req.files || !req.files.prePlantationImage || !req.files.plantationImage) {
            return res.status(400).json({ message: 'Both prePlantationImage and plantationImage are required!' });
        }

        // ✅ Extract & validate required fields
        const {
            plantationType, areaType, area, location, boundaryPoints, userMobile, userName, plantName,
            height, event, userIp, userLocation, latitude, longitude, district, gpName,
            createdBy, eventId, campaignId, categoryId
        } = req.body;

        const requiredFields = [
            'plantationType', 'areaType', 'location', 'boundaryPoints', 'userMobile', 'userName',
            'plantName', 'height', 'event', 'userIp', 'userLocation', 'latitude', 'longitude',
            'district', 'gpName', 'categoryId', 'createdBy', 'area'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({ message: `Missing fields: ${missingFields.join(', ')}` });
        }

        // ✅ Check if user is registered
        const user = await User.findOne({ phone: userMobile });
        if (!user) {
            return res.status(400).json({ message: 'User not registered! Please register first.' });
        }

        // ✅ Parse location & boundary points
        let parsedLocation, parsedBoundaryPoints;
        try {
            parsedLocation = JSON.parse(location);
            parsedBoundaryPoints = JSON.parse(boundaryPoints);
        } catch (error) {
            return res.status(400).json({ message: 'Invalid JSON format in location or boundaryPoints!' });
        }

        // ✅ Validate `createdBy` ID
        const userId = mongoose.Types.ObjectId.isValid(createdBy) ? new mongoose.Types.ObjectId(createdBy) : null;
        if (!userId) {
            return res.status(400).json({ message: "Invalid createdBy ID format" });
        }

        // ✅ Validate plantation type
        const allowedPlantationTypes = ['Teak', 'Bamboo', 'Neem', 'Mahogany'];
        if (!allowedPlantationTypes.includes(plantationType)) {
            return res.status(400).json({ message: 'Invalid plantation type!' });
        }

        // ✅ Validate eventId if provided
        if (eventId) {
            const eventExists = await Event.findById(eventId);
            if (!eventExists) {
                return res.status(400).json({ message: `Event not found with ID: ${eventId}` });
            }
        }

        // ✅ Validate campaignId if provided
        if (campaignId) {
            const campaignExists = await Campaign.findById(campaignId);
            if (!campaignExists) {
                return res.status(400).json({ message: `Campaign not found with ID: ${campaignId}` });
            }
        }

        // ✅ Create new plantation entry
        const newPlantation = new BlockPlantation({
            plantationType,
            areaType,
            area,
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
            createdBy: userId
        });

        await newPlantation.save();

        // ✅ Create user activity log
        const activity = new Activity({
            userId,
            plantName,
            height: parseFloat(height),
            areaType,
            event,
            area,
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
            message: '✅ Block Plantation successfully created!',
            data: newPlantation
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
// 📌 Get all Block Plantations
exports.getAllBlockPlantations = async (req, res) => {
    try {
        let query = {};

        // 🛑 Admin access restriction
        if (req.user.role === 'admin') {
            const admin = await User.findById(req.user.id);
            if (!admin) return res.status(404).json({ message: 'Admin not found' });

            const cityUsers = await User.find({ city: admin.city }).select('_id');
            query.createdBy = { $in: cityUsers.map(user => user._id) };
        }

        const plantations = await BlockPlantation.find(query)
            .populate('createdBy', 'firstName lastName city')
            .sort({ createdAt: -1 });

        res.status(200).json({ message: 'Block plantations retrieved successfully', plantations });
    } catch (error) {
        console.error('Error fetching block plantations:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// 📌 Update Block Plantation
exports.updateBlockPlantation = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid plantation ID' });
    }

    try {
        const { plantationType, areaType, latitude, longitude, boundaryPoints } = req.body;

        if (!plantationType || !areaType || !latitude || !longitude || !boundaryPoints) {
            return res.status(400).json({ message: 'All fields are required!' });
        }

        let parsedBoundaryPoints;
        try {
            parsedBoundaryPoints = JSON.parse(boundaryPoints);
        } catch (err) {
            return res.status(400).json({ message: 'Invalid boundaryPoints format' });
        }

        const updatedData = {
            plantationType,
            areaType,
            location: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] },
            boundaryPoints: parsedBoundaryPoints
        };

        const existingPlantation = await BlockPlantation.findById(id);
        if (!existingPlantation) {
            return res.status(404).json({ message: 'Block plantation not found' });
        }

        // Handle image updates
        if (req.files?.prePlantationImage) {
            deleteFile(existingPlantation.prePlantationImage?.path);
            updatedData.prePlantationImage = req.files.prePlantationImage[0];
        }
        if (req.files?.plantationImage) {
            deleteFile(existingPlantation.plantationImage?.path);
            updatedData.plantationImage = req.files.plantationImage[0];
        }

        const updatedPlantation = await BlockPlantation.findByIdAndUpdate(id, updatedData, { new: true });

        res.status(200).json({ message: 'Block plantation updated successfully', plantation: updatedPlantation });
    } catch (error) {
        console.error('Error updating block plantation:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

// 📌 Delete Block Plantation
exports.deleteBlockPlantation = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid plantation ID' });
    }

    try {
        const deletedPlantation = await BlockPlantation.findById(id);

        if (!deletedPlantation) {
            return res.status(404).json({ message: 'Block plantation not found' });
        }

        // Delete stored images
        deleteFile(deletedPlantation.prePlantationImage?.path);
        deleteFile(deletedPlantation.plantationImage?.path);

        await BlockPlantation.findByIdAndDelete(id);

        res.status(200).json({ message: 'Block plantation deleted successfully' });
    } catch (error) {
        console.error('Error deleting block plantation:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};
