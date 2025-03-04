const Corporate = require('../models/corporateModel');
const { deleteFile } = require('../utils/fileUtils');

// 📌 Get all corporate entries
exports.getAllCorporates = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const query = {};

        // Apply filters
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { 'contactPerson.name': new RegExp(search, 'i') },
                { 'contactPerson.email': new RegExp(search, 'i') }
            ];
        }

        const corporates = await Corporate.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Corporate.countDocuments(query);

        res.status(200).json({
            success: true,
            data: corporates,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('❌ Error getting corporates:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching corporate entries',
            error: error.message
        });
    }
};

// 📌 Create new corporate entry
exports.createCorporate = async (req, res) => {
    try {
        const {
            name, description, website, contactPerson,
            address, plantationGoal
        } = req.body;

        // Validate required fields
        if (!name || !description || !contactPerson) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Create corporate entry
        const corporate = new Corporate({
            name,
            description,
            website,
            contactPerson,
            address,
            plantationGoal: parseInt(plantationGoal) || 0,
            logo: req.file ? {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size
            } : null,
            createdBy: req.user.id
        });

        await corporate.save();

        res.status(201).json({
            success: true,
            message: 'Corporate entry created successfully',
            data: corporate
        });
    } catch (error) {
        console.error('❌ Error creating corporate:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating corporate entry',
            error: error.message
        });
    }
};

// 📌 Update corporate entry
exports.updateCorporate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Handle file upload if present
        if (req.file) {
            const corporate = await Corporate.findById(id);
            if (corporate?.logo?.path) {
                deleteFile(corporate.logo.path);
            }
            updateData.logo = {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype,
                size: req.file.size
            };
        }

        const corporate = await Corporate.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!corporate) {
            return res.status(404).json({
                success: false,
                message: 'Corporate entry not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Corporate entry updated successfully',
            data: corporate
        });
    } catch (error) {
        console.error('❌ Error updating corporate:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating corporate entry',
            error: error.message
        });
    }
};

// 📌 Delete corporate entry
exports.deleteCorporate = async (req, res) => {
    try {
        const { id } = req.params;
        const corporate = await Corporate.findById(id);

        if (!corporate) {
            return res.status(404).json({
                success: false,
                message: 'Corporate entry not found'
            });
        }

        // Delete logo file if exists
        if (corporate.logo?.path) {
            deleteFile(corporate.logo.path);
        }

        await corporate.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Corporate entry deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting corporate:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting corporate entry',
            error: error.message
        });
    }
};




