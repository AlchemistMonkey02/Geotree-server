const express = require('express');
const { createEvent, getEvents, getEventById } = require('../controllers/eventController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { uploadVideo } = require('../utils/fileUpload');

const router = express.Router();

// 📌 Create Event (Admins & Superadmins) with Video Upload or URL
router.post('/create-event', authenticateToken, authorizeRoles('admin', 'superadmin'), uploadVideo.single('video'), createEvent);

// 📌 Get Events (Public)
router.get('/events', getEvents);

// 📌 Get Event By ID
router.get('/events/:id', getEventById);

module.exports = router;
