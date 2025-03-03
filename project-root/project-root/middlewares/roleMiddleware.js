// 📌 Authorize Roles (Admin, Superadmin, User)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied. Insufficient role permissions.' });
        }
        next();
    };
};

// 📌 Restrict Action to the Original Admin (Superadmin Only)
const isOriginalAdmin = (req, res, next) => {
    if (req.user.email !== process.env.SUPERADMIN_EMAIL) {
        return res.status(403).json({ message: 'Access denied. Only the original superadmin can perform this action.' });
    }
    next();
};

module.exports = {
    authorizeRoles,
    isOriginalAdmin,
};
