const express = require('express');
const router = express.Router();
const Category = require('../models/Category'); // Assuming you have a Category model

// Route to get tree categories
router.get('/treecategories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 }); // Fetch and sort categories
        const treeCategories = buildCategoryTree(categories); // Function to build tree structure
        res.json(treeCategories);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Function to build a tree structure from flat categories
function buildCategoryTree(categories) {
    const categoryMap = {};
    const tree = [];

    categories.forEach(category => {
        categoryMap[category.id] = { ...category, children: [] }; // Create a map of categories
    });

    categories.forEach(category => {
        if (category.parentId) {
            categoryMap[category.parentId].children.push(categoryMap[category.id]); // Build tree
        } else {
            tree.push(categoryMap[category.id]); // Root categories
        }
    });

    return tree;
}

module.exports = router; 