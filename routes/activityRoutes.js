const express = require('express');
const { 
    getAllActivities, 
    exportActivities, 
    getActivityAnalytics,
    createBlockPlantation
} = require('../controllers/activityController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadPlantationImages } = require('../utils/fileUtils');

const router = express.Router();

// 📌 Create Block Plantation
router.post('/blockPlantation', 
    authenticateToken, 
    uploadPlantationImages, // This middleware is already configured for both image fields
    createBlockPlantation
);

// 📌 Get all activities (Only Admins & Superadmins can access)
router.get('/activities', 
    authenticateToken, 
    authorizeRoles('admin', 'superadmin'), 
    getAllActivities
);

// 📌 Export activities (CSV/Excel)
router.get('/export', 
    authenticateToken, 
    authorizeRoles('admin', 'superadmin'), 
    exportActivities
);

// 📌 Get activity analytics (Charts & Reports)
router.get('/analytics', 
    authenticateToken, 
    authorizeRoles('admin', 'superadmin'), 
    getActivityAnalytics
);

module.exports = router;
