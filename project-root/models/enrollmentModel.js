const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    enrollmentDate: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
