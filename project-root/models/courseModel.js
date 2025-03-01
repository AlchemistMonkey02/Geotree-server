const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: String,
    duration: String,
    level: String,
    image: String,
}, { timestamps: true });

module.exports = mongoose.model("Course", courseSchema);
