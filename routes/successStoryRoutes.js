const express = require('express');
const {
    createSuccessStory,
    getSuccessStories,
    updateSuccessStory,
    deleteSuccessStory
} = require('../controllers/successStoryController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { uploadSuccessStory } = require('../utils/fileUpload');

const router = express.Router();

// 📌 Create a success story (Admins & Superadmins only)
router.post('/create', authenticateToken, authorizeRoles('admin', 'superadmin'), uploadSuccessStory.single('image'), createSuccessStory);

// 📌 Get all success stories with pagination
router.get('/list', getSuccessStories);

// 📌 Update a success story (Admins & Superadmins only)
router.put('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), uploadSuccessStory.single('image'), updateSuccessStory);

// 📌 Delete a success story (Admins & Superadmins only)
router.delete('/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), deleteSuccessStory);

module.exports = router;
