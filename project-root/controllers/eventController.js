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
