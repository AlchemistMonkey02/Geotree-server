const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/authMiddleware');
const { uploadImage } = require('../utils/fileUtils');
const {
    getAllCorporates,
    createCorporate,
    updateCorporate,
    deleteCorporate
} = require('../controllers/corporateController');

const router = express.Router();

// 📌 Get all corporate entries (Admin & Superadmin only)
router.get('/',
    authenticateToken,
    authorizeRoles('admin', 'superadmin'),
    getAllCorporates
);

// 📌 Create new corporate entry (Admin & Superadmin only)
router.post('/',
    authenticateToken,
    authorizeRoles('admin', 'superadmin'),
    uploadImage.single('logo'),
    createCorporate
);

// 📌 Update corporate entry (Admin & Superadmin only)
router.put('/:id',
    authenticateToken,
    authorizeRoles('admin', 'superadmin'),
    uploadImage.single('logo'),
    updateCorporate
);

// 📌 Delete corporate entry (Superadmin only)
router.delete('/:id',
    authenticateToken,
    authorizeRoles('superadmin'),
    deleteCorporate
);

module.exports = router; 