const TreeCategory = require('../models/treeCategoryModel');

// 📌 Create Tree Category
exports.createTreeCategory = async (req, res) => {
    try {
        const { name, description, species } = req.body;

        // Check if category already exists
        const existingCategory = await TreeCategory.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Tree category already exists!' });
        }

        const newCategory = new TreeCategory({ name, description, species });
        await newCategory.save();

        res.status(201).json({ message: 'Tree category created successfully!', category: newCategory });
    } catch (error) {
        console.error('Error creating tree category:', error);
        res.status(500).json({ message: 'Error creating tree category', error: error.message });
    }
};

// 📌 Get All Tree Categories
exports.getTreeCategories = async (req, res) => {
    try {
        const categories = await TreeCategory.find();
        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching tree categories:', error);
        res.status(500).json({ message: 'Error fetching tree categories', error: error.message });
    }
};

// 📌 Get Single Tree Category by ID
exports.getTreeCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await TreeCategory.findById(id);

        if (!category) {
            return res.status(404).json({ message: 'Tree category not found' });
        }

        res.status(200).json(category);
    } catch (error) {
        console.error('Error fetching tree category:', error);
        res.status(500).json({ message: 'Error fetching tree category', error: error.message });
    }
};

// 📌 Update Tree Category
exports.updateTreeCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, species } = req.body;

        const updatedCategory = await TreeCategory.findByIdAndUpdate(
            id, 
            { name, description, species }, 
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: 'Tree category not found' });
        }

        res.status(200).json({ message: 'Tree category updated successfully!', category: updatedCategory });
    } catch (error) {
        console.error('Error updating tree category:', error);
        res.status(500).json({ message: 'Error updating tree category', error: error.message });
    }
};

// 📌 Delete Tree Category
exports.deleteTreeCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedCategory = await TreeCategory.findByIdAndDelete(id);
        if (!deletedCategory) {
            return res.status(404).json({ message: 'Tree category not found' });
        }

        res.status(200).json({ message: 'Tree category deleted successfully!' });
    } catch (error) {
        console.error('Error deleting tree category:', error);
        res.status(500).json({ message: 'Error deleting tree category', error: error.message });
    }
};
