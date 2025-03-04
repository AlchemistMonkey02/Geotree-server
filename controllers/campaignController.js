const Campaign = require('../models/campaignModel');
const { deleteFile } = require('../utils/fileUtils');

// 📌 Create Campaign
exports.createCampaign = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Image is required' });

        const newCampaign = new Campaign({ name, description, image: req.file.path });
        await newCampaign.save();

        res.status(201).json({ message: '✅ Campaign created successfully!', campaign: newCampaign });
    } catch (error) {
        console.error('❌ Error creating campaign:', error);
        res.status(500).json({ message: 'Error creating campaign', error: error.message });
    }
};

// 📌 Get All Campaigns (With Pagination)
exports.getAllCampaigns = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = Math.max(parseInt(page, 10) || 1, 1);
        limit = Math.max(parseInt(limit, 10) || 10, 1);

        const campaigns = await Campaign.find()
            .select("name description image createdAt")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalCampaigns = await Campaign.countDocuments();

        res.status(200).json({
            campaigns,
            totalPages: Math.ceil(totalCampaigns / limit),
            currentPage: page,
            totalCampaigns,
        });
    } catch (error) {
        res.status(500).json({ message: "❌ Error fetching campaigns", error: error.message });
    }
};

// 📌 Update Campaign
exports.updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        let updatedData = { name, description };

        if (req.file) {
            const campaign = await Campaign.findById(id);
            if (!campaign) return res.status(404).json({ message: "❌ Campaign not found" });

            // Delete old image
            deleteFile(campaign.image);
            updatedData.image = req.file.path;
        }

        const updatedCampaign = await Campaign.findByIdAndUpdate(id, updatedData, { new: true });

        if (!updatedCampaign) return res.status(404).json({ message: "❌ Campaign not found" });

        res.status(200).json({ message: "✅ Campaign updated successfully!", campaign: updatedCampaign });
    } catch (error) {
        res.status(500).json({ message: "❌ Error updating campaign", error: error.message });
    }
};

// 📌 Delete Campaign
exports.deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;

        const campaign = await Campaign.findById(id);
        if (!campaign) return res.status(404).json({ message: "❌ Campaign not found" });

        // Delete campaign image
        deleteFile(campaign.image);

        await Campaign.findByIdAndDelete(id);

        res.status(200).json({ message: "✅ Campaign deleted successfully!" });
    } catch (error) {
        res.status(500).json({ message: "❌ Error deleting campaign", error: error.message });
    }
};
