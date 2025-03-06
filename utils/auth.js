const jwt = require('jsonwebtoken');

// Generate a token for a user
const generateToken = (user) => {
    return jwt.sign({ id: user.userId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ status: 'error', message: 'Invalid token.' });
        }
        req.user = user; // Attach user info to request
        next();
    });
};

module.exports = { generateToken, authenticateToken }; 