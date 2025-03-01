// Load environment variables first
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');

// ✅ Import Middlewares
const { authenticateToken, refreshTokenMiddleware } = require('./middlewares/authMiddleware');
const { authorizeRoles, isOriginalAdmin } = require('./middlewares/roleMiddleware');
const { generalLimiter, loginLimiter } = require('./middlewares/rateLimiter');

// ✅ Import Routes
const userRoutes = require('./routes/userRoutes');
const tableRoutes = require('./routes/tableRoutes');
const blockPlantationRoutes = require('./routes/blockPlantationRoutes');
const plantationRoutes = require('./routes/plantationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const campaignRoutes = require('./routes/campaignRoutes');
const treeCategoryRoutes = require('./routes/treeCategoryRoutes');
const eventRoutes = require('./routes/eventRoutes');
const corporateRoutes = require('./routes/corporateRoutes');
const educationRoutes = require('./routes/educationRoutes');
const userHistoryRoutes = require('./routes/userHistoryRoutes');
const activityRoutes = require('./routes/activityRoutes');

const app = express();

// ✅ Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(generalLimiter);

// ✅ Improved MongoDB Connection with Advanced Options
const connectDB = async () => {
    try {
        // Log the MongoDB URI (without sensitive data)
        console.log('📌 Attempting MongoDB connection...');
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI environment variable is not defined');
        }

        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        });
        console.log('✅ MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        // Retry connection after 5 seconds
        console.log('🔄 Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

// ✅ Initialize Database Connection
connectDB();

// ✅ Define Routes
app.use('/api/users', userRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/blockPlantation', blockPlantationRoutes);
app.use('/api/plantation', plantationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/tree-categories', treeCategoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/corporate', corporateRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/history', userHistoryRoutes);
app.use('/api/activity', activityRoutes);

// ✅ Refresh Token Route (If Needed)
app.post('/api/refresh-token', refreshTokenMiddleware);

// ✅ Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: '🌿 API is running successfully!' });
});

// ✅ Enhanced Error Handling Middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);

    // Mongoose Validation Error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // JWT Error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid token'
        });
    }

    // Rate Limit Error
    if (err.status === 429) {
        return res.status(429).json({
            status: 'error',
            message: 'Too many requests. Please try again later.'
        });
    }

    // Default Error
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ✅ Unhandled Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// ✅ Uncaught Exception Handler
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port http://127.0.0.1:${PORT}`));
