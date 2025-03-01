const Activity = require('../models/activityModel');
const exceljs = require("exceljs");
const { stringify } = require("fast-csv");
const PDFDocument = require("pdfkit");

// 📌 Export User History (CSV, Excel, PDF)
exports.exportUserHistory = async (req, res) => {
    try {
        const { format } = req.query;
        if (!format || !['csv', 'excel', 'pdf'].includes(format)) {
            return res.status(400).json({ message: 'Invalid format. Use csv, excel, or pdf.' });
        }

        const userId = req.user.id;
        const activities = await Activity.find({ userId })
            .populate('treeCategory', 'name')
            .populate('eventId', 'title description')
            .lean();

        if (!activities.length) {
            return res.status(404).json({ message: 'No user history available for export' });
        }

        // 📌 Export as CSV
        if (format === 'csv') {
            res.setHeader('Content-Disposition', 'attachment; filename=user_history.csv');
            res.setHeader('Content-Type', 'text/csv');
            stringify(activities, { headers: true }).pipe(res);
        }

        // 📌 Export as Excel
        else if (format === 'excel') {
            const workbook = new exceljs.Workbook();
            const worksheet = workbook.addWorksheet('User History');

            worksheet.columns = Object.keys(activities[0] || {}).map(key => ({ header: key, key }));
            activities.forEach(activity => worksheet.addRow(activity));

            res.setHeader('Content-Disposition', 'attachment; filename=user_history.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

            await workbook.xlsx.write(res);
            res.end();
        }

        // 📌 Export as PDF
        else if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Disposition', 'attachment; filename=user_history.pdf');
            res.setHeader('Content-Type', 'application/pdf');
            doc.pipe(res);

            doc.fontSize(16).text('User Activity History', { align: 'center' }).moveDown();
            activities.forEach((activity, index) => {
                doc.fontSize(12).text(`${index + 1}. ${activity.plantName} - ${activity.eventId?.title || 'No Event'}`);
                doc.moveDown();
            });

            doc.end();
        }
    } catch (error) {
        res.status(500).json({ message: 'Error exporting user history', error: error.message });
    }
};

// 📌 Get User History with Filters & Pagination
exports.getUserHistory = async (req, res) => {
    let { page = 1, limit = 10, event, startDate, endDate, latMin, latMax, longMin, longMax, sort } = req.query;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.max(parseInt(limit, 10) || 10, 1);
    const userId = req.user.id;

    let query = { userId };
    let sortOption = { createdAt: -1 }; // Default: Newest First

    // 📌 Apply Filters
    if (event) query.event = new RegExp(event, 'i'); // Case-insensitive event search
    if (startDate && endDate) {
        query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // 📌 Apply Location Filter
    if (latMin && latMax && longMin && longMax) {
        query["location.coordinates"] = {
            $geoWithin: {
                $box: [
                    [parseFloat(longMin), parseFloat(latMin)],
                    [parseFloat(longMax), parseFloat(latMax)]
                ]
            }
        };
    }

    // 📌 Sorting Options
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "height_desc") sortOption = { height: -1 };
    if (sort === "height_asc") sortOption = { height: 1 };

    try {
        const activities = await Activity.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('treeCategory', 'name')
            .populate('eventId', 'title description');

        const totalActivities = await Activity.countDocuments(query);

        res.status(200).json({
            activities,
            totalPages: Math.ceil(totalActivities / limit),
            currentPage: page,
            totalActivities,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user history', error: error.message });
    }
};

// 📌 Get Activity Analytics
exports.getActivityAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        // 📌 Get total activities
        const totalActivities = await Activity.countDocuments(dateFilter);

        // 📌 Get top 5 events
        const topEvents = await Activity.aggregate([
            { $match: dateFilter },
            { $group: { _id: "$event", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({ totalActivities, topEvents });
    } catch (error) {
        res.status(500).json({ message: "Error fetching analytics", error: error.message });
    }
};

// 📌 Update Activity
exports.updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const activity = await Activity.findOne({ _id: id, userId });
        if (!activity) {
            return res.status(404).json({ message: "Activity not found or not authorized" });
        }

        const updatedActivity = await Activity.findByIdAndUpdate(id, req.body, { new: true });

        res.status(200).json({ message: "Activity updated successfully", activity: updatedActivity });
    } catch (error) {
        res.status(500).json({ message: "Error updating activity", error: error.message });
    }
};

// 📌 Delete Activity
exports.deleteActivity = async (req, res) => {
    const { id } = req.params;

    try {
        const activity = await Activity.findById(id);
        
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: 'Activity not found'
            });
        }

        await Activity.findByIdAndDelete(id);
        
        res.status(200).json({
            success: true,
            message: 'Activity deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting activity:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting activity',
            error: error.message
        });
    }
};

// 📌 Admin Get All User History
exports.adminGetAllUserHistory = async (req, res) => {
    let { page = 1, limit = 10, userId } = req.query;

    page = Math.max(parseInt(page, 10) || 1, 1);
    limit = Math.max(parseInt(limit, 10) || 10, 1);

    let query = {};
    if (userId) query.userId = userId;

    try {
        const activities = await Activity.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate('treeCategory', 'name')
            .populate('eventId', 'title description')
            .populate('userId', 'firstName lastName email');

        const totalActivities = await Activity.countDocuments(query);

        res.status(200).json({
            success: true,
            activities,
            totalPages: Math.ceil(totalActivities / limit),
            currentPage: page,
            totalActivities,
        });
    } catch (error) {
        console.error('❌ Error fetching user history:', error);
        res.status(500).json({ 
            success: false,
            message: "Error fetching user history", 
            error: error.message 
        });
    }
};
