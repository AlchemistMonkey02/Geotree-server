const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { saveUserToTable, generateAccessToken, generateRefreshToken } = require('../utils/helpers');
const AppError = require('../utils/AppError');
const IndividualPlantation = require('../models/individualPlantationModel');
const BlockPlantation = require('../models/blockPlantationModel');

// Minimal email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    pool: true,
});

// Ultra-minimal settings
const SALT_ROUNDS = 10;  // Increased for better security
const TOKEN_LENGTH = 32; // Increased token size for better security

// Non-blocking email verification
const sendVerificationEmail = async (user) => {
    const token = crypto.randomBytes(TOKEN_LENGTH).toString('hex');
    const url = `${process.env.CLIENT_URL}/verify-email/${token}`;

    // Fire and forget all operations
    try {
        await Promise.all([
            User.updateOne(
                { _id: user._id },
                { $set: { emailVerificationToken: token, emailVerificationExpires: Date.now() + 900000 } }
            ),
            transporter.sendMail({
                to: user.email,
                subject: 'Verify Email',
                text: url,
                from: process.env.EMAIL_USER
            })
        ]);
    } catch (error) {
        console.error('Error sending verification email:', error);
    }
};

exports.signup = async (req, res, next) => {
    const { firstName, lastName, email, password, confirmPassword, phone, city } = req.body;

    // Fast validation
    if (!firstName || !lastName || !email || !password || !confirmPassword || !phone) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check for existing user by email
    const existingUserByEmail = await User.findOne({ email });
    if (existingUserByEmail) {
        return res.status(400).json({ message: 'Email exists' });
    }

    // Check for existing user by phone
    const existingUserByPhone = await User.findOne({ phone });
    if (existingUserByPhone) {
        return res.status(400).json({ message: 'Phone number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user
    const user = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone,
        city
    });

    // Save user and assign to table
    try {
        const savedUser = await user.save();
        await saveUserToTable(savedUser);

        // Generate tokens
        const accessToken = generateAccessToken(savedUser._id, savedUser.role);
        const refreshToken = generateRefreshToken(savedUser._id);

        // Respond with user data and tokens
        return res.status(201).json({ id: savedUser.userId, accessToken, refreshToken });
    } catch (error) {
        if (error.code === 11000) {
            const duplicateKey = Object.keys(error.keyValue)[0];
            return res.status(400).json({ message: `Duplicate key error: ${duplicateKey} already exists` });
        }
        return next(new AppError('Error saving user', 500));
    }
};

// 📌 Verify Email Controller
exports.verifyEmail = async (req, res) => {
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
};

// 📌 Generate OTP (for login)
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
exports.refreshToken = async (req, res) => {
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
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ accessToken: newAccessToken, refreshToken: 'Rotated' });
    });
};

// 📌 Logout Controller
exports.logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(400).json({ message: 'No refresh token provided' });

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return res.status(400).json({ message: 'Invalid refresh token' });

    // Remove the refresh token from the user's record
    user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
    await user.save();

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });
    
    // Send a success response
    res.status(200).json({ message: 'Logout successful' });
};

// 📌 OTP Verification Controller
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if OTP matches and is within a valid timeframe
    if (user.otp === otp && user.otpExpires > Date.now()) {
        user.otp = undefined; // Clear OTP after successful verification
        await user.save();

        res.status(200).json({ message: 'OTP verified successfully' });
    } else {
        res.status(400).json({ message: 'Invalid or expired OTP' });
    }
};

// 📌 Admin Verify User Controller
exports.adminVerifyUser = async (req, res) => {
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
};

// 📌 Get Pending Verifications Controller
exports.getPendingVerifications = async (req, res) => {
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
};

// 📌 Login Controller
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({
            message: 'User not found',
            rewardPoints: 0 // Default value
        });
    }

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
            adminVerificationStatus: user.adminVerificationStatus,
            rewardPoints: user.rewardPoints || 0 // Ensure rewardPoints is returned
        }
    });
};

// 📌 Forgot Password Controller
exports.forgotPassword = async (req, res) => {
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
};

// 📌 Reset Password Controller
exports.resetPassword = async (req, res) => {
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

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
};

// 📌 Verify User Function
exports.verifyUser = async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    user.verified = true; // Assuming you have a `verified` field in your User model
    await user.save();

    return res.status(200).json({ message: 'User verified successfully' });
};

// 📌 Super Admin Login Controller
exports.superAdminLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await User.findOne({ email, role: 'superadmin' });
    if (!admin) return res.status(404).json({ message: 'Super admin not found' });

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

    const accessToken = generateAccessToken(admin._id, admin.role);
    const refreshToken = generateRefreshToken(admin._id);

    admin.refreshTokens = admin.refreshTokens || [];
    admin.refreshTokens.push(refreshToken);
    await admin.save();

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
        accessToken,
        user: {
            id: admin._id,
            email: admin.email,
            firstName: admin.firstName,
            lastName: admin.lastName,
            role: admin.role,
            verified: admin.verified
        }
    });
};

// 📌 Award Reward Points Function
exports.awardRewardPoints = async (req, res) => {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    const [individualPlantations, blockPlantations] = await Promise.all([
        IndividualPlantation.find({ createdBy: userId }),
        BlockPlantation.find({ createdBy: userId })
    ]);

    const totalPointsToAdd = individualPlantations.reduce((total, plantation) => total + plantation.plants.length, 0) +
                              blockPlantations.reduce((total, plantation) => total + plantation.plants.length, 0);

    user.rewardPoints = (user.rewardPoints || 0) + totalPointsToAdd;
    await user.save();

    return res.status(200).json({ rewardPoints: user.rewardPoints });
}
