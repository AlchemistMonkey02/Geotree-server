const User = require("../models/User");
const { generateToken } = require("../utils/auth");

// Login route
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) {
            return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
        }

        const token = generateToken(user);
        res.status(200).json({ token });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { login }; 