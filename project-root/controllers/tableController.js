const { Table1, Table2, Table3 } = require('../models/tableModel');
const TrackingTable = require('../models/trackingModel');

// 📌 Get all records from a specific table
exports.getTableRecords = async (req, res) => {
    const { tableNumber } = req.params;

    try {
        let records;
        switch (parseInt(tableNumber)) {
            case 1:
                records = await Table1.find();
                break;
            case 2:
                records = await Table2.find();
                break;
            case 3:
                records = await Table3.find();
                break;
            default:
                return res.status(400).json({ message: 'Invalid table number. Must be 1, 2, or 3' });
        }

        res.status(200).json({ records });
    } catch (error) {
        console.error('Error fetching table records:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// 📌 Track a user's entry in a table
exports.trackUserEntry = async (req, res) => {
    const { userId, username, tableNumber, value } = req.body;

    try {
        // Validate table number
        if (![1, 2, 3].includes(parseInt(tableNumber))) {
            return res.status(400).json({ message: 'Invalid table number. Must be 1, 2, or 3' });
        }

        const trackingEntry = new TrackingTable({ userId, username, tableNumber, value });
        await trackingEntry.save();

        res.status(201).json({ message: 'User entry tracked successfully', trackingEntry });
    } catch (error) {
        console.error('Error tracking user entry:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};
