const crypto = require("crypto");

const generateApiKey = () => {
    return crypto.randomBytes(20).toString("hex"); // Generates a random API key
};


module.exports = generateApiKey; 