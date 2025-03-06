const Organization = require('../models/organizationModel');

// 📌 Create a new organization
exports.createOrganization = async (req, res) => {
    try {
        const organization = new Organization(req.body);
        await organization.save();
        res.status(201).json(organization);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// 📌 Get all organizations
exports.getOrganizations = async (req, res) => {
    try {
        const organizations = await Organization.find({}, { organizationType: 1, _id: 0 });
        res.status(200).json(organizations);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
