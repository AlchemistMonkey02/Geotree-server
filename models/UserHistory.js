const mongoose = require("mongoose");

const userHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    activity: {
        type: String,
        required: true, // Description of the activity
    },
    timestamp: {
        type: Date,
        default: Date.now, // Automatically set the timestamp to the current date
    },
});

const UserHistory = mongoose.model("UserHistory", userHistorySchema);

module.exports = UserHistory; 