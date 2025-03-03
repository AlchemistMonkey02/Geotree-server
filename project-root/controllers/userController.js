const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');
const { saveUserToTable, generateAccessToken, generateRefreshToken } = require('../utils/helpers');
const AppError = require('../utils/AppError');

// Minimal email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    pool: true,
    maxConnections: 20,
    maxMessages: Infinity,
    rateDelta: 100,
    rateLimit: 20
});

// Ultra-minimal settings
const SALT_ROUNDS = 4;  // Absolute minimum for basic security
const TOKEN_LENGTH = 4; // Minimal token size

// Non-blocking email verification
const sendVerificationEmail = (user) => {
    const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');
    const url = `${process.env.CLIENT_URL}/verify-email/${token}`;

    // Fire and forget all operations
    setImmediate(() => {
        Promise.all([
            User.updateOne(
                { _id: user._id },
                { $set: { emailVerificationToken: token, emailVerificationExpires: new Date(Date.now() + 900000) } }
            ),
            transporter.sendMail({
                to: user.email,
                subject: 'Verify Email',
                text: url,
                from: process.env.EMAIL_USER
            })
        ]).catch(() => {});
    });
};

exports.signup = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, phone, city } = req.body;

        // Fast validation
        if (!firstName || !lastName || !email || !password || !phone) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Run all operations in parallel
        const [hashedPassword, existingUser] = await Promise.all([
            bcrypt.hash(password, SALT_ROUNDS),
            User.findByEmail(email)
        ]);

        if (existingUser) {
            return res.status(400).json({ message: 'Email exists' });
        }

        // Create minimal user
        const user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            city
        });

        // Save and assign table in parallel
        const [savedUser, tableData] = await Promise.all([
            user.save({ validateBeforeSave: true }),
            saveUserToTable(user)
        ]);

        // Use the centralized functions
        generateAccessToken(savedUser._id, savedUser.role);
        generateRefreshToken(savedUser._id);

        // Minimal response
        return res.status(201).json({ id: savedUser.userId });

    } catch (err) {
        next(new AppError('We encountered an issue during signup. Please try again later.', 400));
    }
};

// 📌 Verify Email Controller
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        
        // Hash the token from params to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid or expired verification token'
            });
        }

        // Update user verification status
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        // Generate tokens for automatic login after verification
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        // Set refresh token in cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            status: 'success',
            message: 'Email verified successfully',
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                isEmailVerified: user.isEmailVerified
            }
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred during email verification'
        });
    }
};

// 📌 Generate OTP (for login)
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 📌 Refresh Token Controller
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

        const user = await User.findOne({ refreshTokens: refreshToken });
        if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid or expired refresh token' });

            // Remove the used refresh token
            user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);

            // Generate new tokens
            const newRefreshToken = generateRefreshToken(decoded.id);
            const newAccessToken = generateAccessToken(decoded.id, decoded.role);

            user.refreshTokens.push(newRefreshToken);
            await user.save();

            res.cookie('refreshToken', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({ accessToken: newAccessToken, refreshToken: 'Rotated' });
        });
    } catch (err) {
        res.status(500).json({ message: 'Error refreshing token', error: err.message });
    }
};

// 📌 Logout Controller
exports.logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) return res.status(400).json({ message: 'No refresh token provided' });

        const user = await User.findOne({ refreshTokens: refreshToken });
        if (!user) return res.status(400).json({ message: 'Invalid refresh token' });

        user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
        await user.save();

        res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
        res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
        res.status(500).json({ message: 'Error logging out', error: err.message });
    }
};


// 📌 OTP Verification Controller
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Example: Check if OTP matches and is within a valid timeframe
        if (user.otp === otp && user.otpExpires > Date.now()) {
            user.otp = undefined; // Clear OTP after successful verification
            await user.save();

            res.status(200).json({ message: 'OTP verified successfully' });
        } else {
            res.status(400).json({ message: 'Invalid or expired OTP' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error verifying OTP', error: err.message });
    }
};

// 📌 Admin Verify User Controller
exports.adminVerifyUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, note } = req.body;
        const adminId = req.user.id; // From auth middleware

        // Check if the requesting user is an admin
        const admin = await User.findById(adminId);
        if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Only administrators can verify users'
            });
        }

        // Find the user to verify
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        // Update verification status
        user.adminVerificationStatus = status;
        user.adminVerificationNote = note || undefined;
        user.adminVerifiedBy = adminId;
        user.adminVerifiedAt = new Date();
        user.adminVerified = status === 'approved';

        await user.save();

        // Send email notification to user
        const emailSubject = status === 'approved' 
            ? 'Your Account Has Been Approved' 
            : 'Account Verification Status Update';

        const emailText = status === 'approved'
            ? `Congratulations! Your account has been verified by our administrators. You can now log in to your account.`
            : `Your account verification status has been updated to: ${status}${note ? '\n\nNote: ' + note : ''}`;

        await transporter.sendMail({
            to: user.email,
            subject: emailSubject,
            text: emailText
        });

        return res.status(200).json({
            status: 'success',
            message: 'User verification status updated successfully',
            data: {
                userId: user._id,
                status: user.adminVerificationStatus,
                verifiedBy: admin.email,
                verifiedAt: user.adminVerifiedAt
            }
        });
    } catch (error) {
        console.error('Admin verification error:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred during admin verification'
        });
    }
};

// 📌 Get Pending Verifications Controller
exports.getPendingVerifications = async (req, res) => {
    try {
        const adminId = req.user.id; // From auth middleware

        // Check if the requesting user is an admin
        const admin = await User.findById(adminId);
        if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'Only administrators can view pending verifications'
            });
        }

        // Get all users with pending verification
        const pendingUsers = await User.find({
            adminVerificationStatus: 'pending',
            verified: true // Only show users who have verified their email
        }).select('firstName lastName email phone city createdAt');

        return res.status(200).json({
            status: 'success',
            count: pendingUsers.length,
            data: pendingUsers
        });
    } catch (error) {
        console.error('Error fetching pending verifications:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while fetching pending verifications'
        });
    }
};

// 📌 Login Controller
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id);

        user.refreshTokens = user.refreshTokens || [];
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            accessToken,
            user: {
                id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                adminVerified: user.adminVerified,
                adminVerificationStatus: user.adminVerificationStatus
            }
        });
    } catch (err) {
        next(new AppError('We encountered an issue while logging you in. Please try again later.', 500));
    }
};

// 📌 Forgot Password Controller
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
        await transporter.sendMail({
            to: user.email,
            subject: 'Password Reset Request',
            text: `Click the following link to reset your password: ${resetUrl}\nIf you didn't request this, please ignore this email.`
        });

        res.status(200).json({ message: 'Password reset link sent to email' });
    } catch (err) {
        res.status(500).json({ message: 'Error sending reset email', error: err.message });
    }
};

// 📌 Reset Password Controller
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Invalid or expired reset token' });

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ message: 'Error resetting password', error: err.message });
    }
};
