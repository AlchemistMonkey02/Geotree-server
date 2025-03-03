const Event = require('../models/eventModel');
const User = require('../models/userModel');

// 📌 Create Event
exports.createEvent = async (req, res) => {
    try {
        const { title, description, videoUrl } = req.body;
        const admin = await User.findById(req.user.userId);

        if (!admin) return res.status(404).json({ message: "Admin not found" });

        const newEvent = new Event({
            title,
            description,
            videoUrl,
            createdBy: req.user.userId,
            city: admin.city
        });

        await newEvent.save();

        res.status(201).json({ message: "✅ Event created successfully", event: newEvent });
    } catch (error) {
        res.status(500).json({ message: "❌ Error creating event", error: error.message });
    }
};

// 📌 Get all events with pagination
exports.getEvents = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = Math.max(parseInt(page, 10) || 1, 1);
        limit = Math.max(parseInt(limit, 10) || 10, 1);

        const events = await Event.find()
            .select("title description videoUrl _id createdBy city createdAt")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate("createdBy", "firstName lastName");

        const totalEvents = await Event.countDocuments();

        res.status(200).json({
            events,
            totalPages: Math.ceil(totalEvents / limit),
            currentPage: page,
            totalEvents,
        });
    } catch (error) {
        res.status(500).json({ message: "❌ Error fetching events", error: error.message });
    }
};

// 📌 Get Event by ID (with Participants)
exports.getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id)
            .populate("createdBy", "firstName lastName city")
            .populate("participants", "firstName lastName email");

        if (!event) return res.status(404).json({ message: "❌ Event not found" });

        res.status(200).json({ event });
    } catch (error) {
        res.status(500).json({ message: "❌ Error fetching event", error: error.message });
    }
};

// 📌 Get filtered events with advanced filtering
exports.getFilteredEvents = async (req, res) => {
    try {
        // Extract filter parameters from query
        const {
            // Pagination
            page = 1,
            limit = 10,

            // User filters
            userId,

            // Location filters
            country,
            state,
            city,

            // Date filters
            startDate,
            endDate,

            // Status filter
            status
        } = req.query;

        // Build filter object
        const filter = {};

        // User filter
        if (userId) {
            filter.createdBy = userId;
        }

        // Location filters - using regex for partial matches
        if (country) {
            filter.country = new RegExp(country, 'i');
        }
        if (state) {
            filter.state = new RegExp(state, 'i');
        }
        if (city) {
            filter.city = new RegExp(city, 'i');
        }

        // Date range filter
        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // Status filter
        if (status) {
            filter.status = status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Fetch filtered events
        const events = await Event.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'firstName lastName');

        const totalEvents = await Event.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            results: events.length,
            pagination: {
                totalEvents,
                totalPages: Math.ceil(totalEvents / parseInt(limit)),
                currentPage: parseInt(page),
                limit: parseInt(limit),
                hasNextPage: page < Math.ceil(totalEvents / parseInt(limit)),
                hasPrevPage: page > 1
            },
            data: events
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};
