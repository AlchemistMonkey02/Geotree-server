const User = require("../models/userModel");

const adminMiddleware = (req, res, next) => {
    const { role } = req.user; // Get role from the authenticated user

    // If the user is an admin or superadmin, proceed to the next middleware
    if (role === 'admin' || role === 'superadmin') {
        return next();
    }

    return res.status(403).json({ status: 'error', message: 'Forbidden: Not an admin' });
};

module.exports = adminMiddleware; 