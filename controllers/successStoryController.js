const SuccessStory = require('../models/successStoryModel');
const { deleteFile } = require('../utils/fileUpload');

// 📌 Create Success Story
exports.createSuccessStory = async (req, res) => {
    try {
        const { title, description, impact } = req.body;

        if (!title || !description || !impact) {
            return res.status(400).json({ message: 'Title, description, and impact are required' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const existingStory = await SuccessStory.findOne({ title });
        if (existingStory) {
            return res.status(400).json({ message: 'A success story with this title already exists' });
        }

        const newSuccessStory = new SuccessStory({
            title,
            description,
            impact,
            image: {
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype
            }
        });

        await newSuccessStory.save();
        res.status(201).json({ message: '✅ Success story created successfully!', successStory: newSuccessStory });
    } catch (error) {
        res.status(500).json({ message: '❌ Error creating success story', error: error.message });
    }
};

// 📌 Get All Success Stories (With Pagination)
exports.getSuccessStories = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = Math.max(parseInt(page, 10) || 1, 1);
        limit = Math.max(parseInt(limit, 10) || 10, 1);

        const successStories = await SuccessStory.find()
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalStories = await SuccessStory.countDocuments();

        res.status(200).json({
            successStories: successStories.map(story => ({
                _id: story._id,
                title: story.title,
                description: story.description,
                impact: story.impact,
                imageUrl: story.image?.path ? `${req.protocol}://${req.get('host')}/${story.image.path}` : null
            })),
            totalPages: Math.ceil(totalStories / limit),
            currentPage: page,
            totalStories,
        });
    } catch (error) {
        res.status(500).json({ message: '❌ Error fetching success stories', error: error.message });
    }
};

// 📌 Update Success Story
exports.updateSuccessStory = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, impact } = req.body;

        let updatedData = { title, description, impact };

        if (req.file) {
            const story = await SuccessStory.findById(id);
            if (!story) return res.status(404).json({ message: "❌ Success story not found" });

            // Delete old image
            deleteFile(story.image.path);
            updatedData.image = {
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size,
                mimetype: req.file.mimetype
            };
        }

        const updatedStory = await SuccessStory.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedStory) return res.status(404).json({ message: "❌ Success story not found" });

        res.status(200).json({ message: "✅ Success story updated successfully!", successStory: updatedStory });
    } catch (error) {
        res.status(500).json({ message: "❌ Error updating success story", error: error.message });
    }
};

// 📌 Delete Success Story
exports.deleteSuccessStory = async (req, res) => {
    try {
        const { id } = req.params;

        const story = await SuccessStory.findById(id);
        if (!story) return res.status(404).json({ message: "❌ Success story not found" });

        // Delete success story image
        deleteFile(story.image.path);

        await SuccessStory.findByIdAndDelete(id);

        res.status(200).json({ message: "✅ Success story deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "❌ Error deleting success story", error: error.message });
    }
};
