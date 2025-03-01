const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const passport = require('passport');  // ✅ Added missing passport import
const { saveUserToTable } = require('../utils/helpers');

// 📌 Generate JWT Tokens
const generateToken = (userId, role) => jwt.sign({ id: userId, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
const generateRefreshToken = (userId) => jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

// 📌 Send Verification Email
const sendVerificationEmail = async (user) => {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // Expires in 15 minutes

    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
        to: user.email,
        subject: 'Verify Your Email',
        text: `Click the link to verify your email: ${verificationUrl}`
    });
};

// 📌 Signup Controller
exports.signup = async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword, phone, city } = req.body;

    try {
        if (!firstName || !lastName || !email || !password || !confirmPassword || !phone || !city) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (password !== confirmPassword) return res.status(400).json({ message: 'Passwords do not match' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ firstName, lastName, email, password: hashedPassword, phone, city: city.trim().toLowerCase() });

        await newUser.save();
        const { tableNumber, savedRecord } = await saveUserToTable(newUser);

        // ✅ Automatically send email verification
        await sendVerificationEmail(newUser);

        res.status(201).json({ message: 'User created successfully. Verification email sent.', tableNumber, tableRecord: savedRecord });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
};

// 📌 Email Verification Controller ✅ Added missing verifyEmail function
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({ emailVerificationToken: hashedToken, emailVerificationExpires: { $gt: Date.now() } });

        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error verifying email', error: err.message });
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
            const newAccessToken = generateToken(decoded.id, decoded.role);

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

// 📌 Login Controller
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(401).json({ message: 'Invalid password' });

        if (!user.isVerified) return res.status(403).json({ message: 'Please verify your email first' });

        const accessToken = generateToken(user._id, user.role);
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
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Error logging in', error: err.message });
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
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });

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
