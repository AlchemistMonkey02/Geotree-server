const express = require('express');
const {
    createCampaign,
    getAllCampaigns,
    updateCampaign,
    deleteCampaign
} = require('../controllers/campaignController');
const { uploadImage } = require('../utils/fileUtils');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// 📌 Create a campaign (Admins & Superadmins only)
router.post('/create', authenticateToken, authorizeRoles('admin', 'superadmin'), uploadImage.single('image'), createCampaign);

// 📌 Get all campaigns with pagination
router.get('/list', authenticateToken, getAllCampaigns);

// 📌 Update campaign details (Admins & Superadmins only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), uploadImage.single('image'), updateCampaign);

// 📌 Delete a campaign (Admins & Superadmins only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), deleteCampaign);

module.exports = router;
