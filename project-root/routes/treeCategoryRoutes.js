const express = require('express');
const { 
    createTreeCategory, 
    getTreeCategories, 
    getTreeCategoryById, 
    updateTreeCategory, 
    deleteTreeCategory 
} = require('../controllers/treeCategoryController');

const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');

const router = express.Router();

// 📌 Public Routes
router.get('/tree-categories', getTreeCategories);
router.get('/tree-categories/:id', getTreeCategoryById);

// 📌 Protected Routes (Only Admins & Superadmins Can Modify Categories)
router.post('/tree-categories', authenticateToken, authorizeRoles('admin', 'superadmin'), createTreeCategory);
router.put('/tree-categories/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), updateTreeCategory);
router.delete('/tree-categories/:id', authenticateToken, authorizeRoles('admin', 'superadmin'), deleteTreeCategory);

module.exports = router;
