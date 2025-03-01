const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 📌 Ensure Upload Directory Exists
const ensureDirectoryExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// 📌 Video Upload Storage
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/videos/';
        ensureDirectoryExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// 📌 File Filter for Videos
const fileFilterVideo = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only video files are allowed'), false);
    }
};

// 📌 Video Upload Middleware
const uploadVideo = multer({ 
    storage: videoStorage, 
    fileFilter: fileFilterVideo,
    limits: { fileSize: 50 * 1024 * 1024 } // Limit: 50MB
});

module.exports = { uploadVideo };
