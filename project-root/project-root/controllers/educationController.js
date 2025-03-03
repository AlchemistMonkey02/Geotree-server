const Course = require('../models/courseModel');
const Enrollment = require('../models/enrollmentModel');

// 📌 Get all courses
exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ message: "Error fetching courses", error });
    }
};

// 📌 Enroll in a Course
exports.enrollInCourse = async (req, res) => {
    try {
        const { userId, courseId } = req.body;
        const enrollment = new Enrollment({ userId, courseId });
        await enrollment.save();
        res.json({ message: "Enrolled successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error enrolling", error });
    }
};
