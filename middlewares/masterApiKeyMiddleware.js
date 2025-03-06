const dotenv = require("dotenv");
dotenv.config();

const masterApiKeyMiddleware = (req, res, next) => {
    const masterApiKey = req.headers['x-master-api-key'];

    // Check if the master API key is provided and valid
    if (masterApiKey && masterApiKey === process.env.MASTER_API_KEY) {
        return next(); // Allow access to all routes
    }

    // If the master API key is not valid, proceed to the next middleware
    next();
};

module.exports = masterApiKeyMiddleware; 