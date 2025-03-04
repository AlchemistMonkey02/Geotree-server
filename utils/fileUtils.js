const fs = require('fs');
const path = require('path');
const multer = require('multer');

// 📌 Ensure upload directory exists
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// 📌 Delete file utility
exports.deleteFile = (filePath) => {
    if (filePath) {
        fs.unlink(path.resolve(filePath), (err) => {
            if (err) console.error('❌ Error deleting file:', err);
        });
    }
};

// 📌 Campaign Image Upload Configuration
const campaignStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/campaigns/';
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'campaign-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const campaignFileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed'), false);
    }
};

exports.uploadImage = multer({
    storage: campaignStorage,
    fileFilter: campaignFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// 📌 Plantation Images Upload Configuration
const plantationStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/plantations/';
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'plantation-' + uniqueSuffix + path.extname(file.originalname));
    }
});

exports.uploadPlantationImages = multer({
    storage: plantationStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
}).fields([
    { name: 'prePlantationImage', maxCount: 1 },
    { name: 'plantationImage', maxCount: 1 }
]);

// 📌 Success Story Image Upload Configuration
const successStoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/successStories/';
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'story-' + uniqueSuffix + path.extname(file.originalname));
    }
});

exports.uploadSuccessStory = multer({
    storage: successStoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
}).single('image');