const mongoose = require('mongoose');
const User = require('../models/userModel');
const Activity = require('../models/activityModel');
const bcrypt = require('bcrypt');

// 📌 Create Admin
exports.createAdmin = async (req, res) => {
    try {
        const { firstName, lastName, email, password, city } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = new User({ 
            firstName, 
            lastName, 
            email, 
            password: hashedPassword, 
            role: 'admin', 
            city,
            verified: true 
        });
        await newAdmin.save();
        res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        res.status(500).json({ message: 'Error creating admin', error: error.message });
    }
};

// 📌 Initialize Super Admin Route Handler
exports.initializeAdmin = async (req, res) => {
    const adminEmail = process.env.ADMIN_EMAIL || "Admin@gpspl.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin@1234";

    if (!adminEmail || !adminPassword) {
        return res.status(400).json({ 
            message: 'Admin credentials not found in environment variables' 
        });
    }

    try {
        const adminExists = await User.findOne({ email: adminEmail });
        if (adminExists) {
            return res.status(200).json({ 
                message: 'Admin already initialized',
                success: true
            });
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const admin = new User({
            firstName: 'Super',
            lastName: 'Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'superadmin',
            verified: true
        });

        await admin.save();
        res.status(201).json({ 
            message: 'Admin initialized successfully',
            success: true
        });
    } catch (error) {
        console.error('❌ Failed to initialize admin:', error);
        res.status(500).json({ 
            message: 'Failed to initialize admin', 
            error: error.message 
        });
    }
};

exports.adminGetAllUserHistory = async (req, res) => {
    let { page = 1, limit = 10, userId } = req.query;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.max(parseInt(limit, 10) || 10, 1);

    let query = {};
    if (userId) query.userId = userId; // Admin can filter by user

    try {
        const activities = await Activity.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('treeCategory', 'name')
            .populate('eventId', 'title description');

        const totalActivities = await Activity.countDocuments(query);

        res.status(200).json({
            activities,
            totalPages: Math.ceil(totalActivities / limit),
            currentPage: page,
            totalActivities,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching user history", error: error.message });
    }
};
