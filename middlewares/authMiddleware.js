const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// 📌 Authenticate JWT Token
const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Authentication Error:', error.message);
        return res.status(403).json({ message: 'Invalid or expired access token' });
    }
};

// 📌 Verify Refresh Token (For Silent Login)
const refreshTokenMiddleware = (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Refresh Token Error:', error.message);
        return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }
};

// 📌 Check User Verification Status
const checkUserVerified = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.verified) {
            return res.status(403).json({ message: 'User is not verified. Please verify your email.' });
        }

        next();
    } catch (error) {
        console.error('❌ Error checking user verification:', error.message);
        res.status(500).json({ message: 'Error checking user verification' });
    }
};

// 📌 Check City Access
const checkCityAccess = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.city !== req.body.city?.toLowerCase()) {
            return res.status(403).json({ message: 'Access denied. You do not have access to this city.' });
        }

        next();
    } catch (error) {
        console.error('❌ Error checking city access:', error.message);
        res.status(500).json({ message: 'Error checking city access' });
    }
};

// 📌 Authorize Roles (Admin, Superadmin, User)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
        }
        next();
    };
};

// 📌 Restrict Action to the Original Admin (Superadmin Only)
const isOriginalAdmin = (req, res, next) => {
    if (req.user.email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Access denied. Only the original superadmin can perform this action.' });
    }
    next();
};

module.exports = {
    authenticateToken,
    refreshTokenMiddleware,
    checkUserVerified,
    checkCityAccess,
    authorizeRoles,
    isOriginalAdmin,
};
