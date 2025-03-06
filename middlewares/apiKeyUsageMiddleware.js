const User = require("../models/User");
const UserAdmin = require("../models/UserAdmin");

const apiKeyUsageMiddleware = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const masterApiKey = req.headers['x-master-api-key']; // Check for master API key

    // If a master API key is provided, allow unlimited access
    if (masterApiKey && masterApiKey === process.env.MASTER_API_KEY) {
        return next(); // Skip usage limit checks
    }

    if (!apiKey) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: No API Key provided' });
    }

    let user = await User.findOne({ apiKey });
    if (!user) {
        user = await UserAdmin.findOne({ apiKey });
        if (!user) {
            return res.status(403).json({ status: 'error', message: 'Forbidden: Invalid API Key' });
        }
    }

    // Check if the usage limit has been reached
    if (user.apiKeyUsage >= user.apiKeyLimit) {
        return res.status(429).json({ status: 'error', message: 'Too many requests. API Key limit reached.' });
    }

    // Increment the usage count
    user.apiKeyUsage += 1;
    await user.save();

    next();
};

module.exports = apiKeyUsageMiddleware; 