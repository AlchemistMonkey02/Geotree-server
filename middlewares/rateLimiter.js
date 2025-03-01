const rateLimit = require('express-rate-limit');

// 📌 General Rate Limiter (Uses environment variables)
const generalLimiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW * 60 * 1000 || 15 * 60 * 1000, 
    max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, 
    message: '❌ Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// 📌 Login Rate Limiter (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: '❌ Too many login attempts. Try again in 15 minutes.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { generalLimiter, loginLimiter };
