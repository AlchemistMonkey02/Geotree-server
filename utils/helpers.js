const { Table1, Table2, Table3 } = require('../models/tableModel');
const TrackingTable = require('../models/trackingModel');
const jwt = require('jsonwebtoken');

// Pre-allocated buffer for ultra-fast lookups
const RANGES = Buffer.alloc(91);  // ASCII 'Z' is 90
for (let i = 65; i <= 90; i++) RANGES[i] = i <= 73 ? 1 : i <= 82 ? 2 : 3;

// Pre-bound table methods for maximum performance
const TABLES = {
    1: Table1.create.bind(Table1),
    2: Table2.create.bind(Table2),
    3: Table3.create.bind(Table3)
};

// Ultra-optimized table lookup
const getTableNumber = c => !c ? null : RANGES[c.toUpperCase().charCodeAt(0)] || null;

const saveUserToTable = async ({ firstName, lastName, _id: userId }) => {
    if (!firstName) throw new Error('Name required');

    const tableNumber = getTableNumber(firstName[0]);
    if (!tableNumber) throw new Error('Invalid name');

    const createRecord = TABLES[tableNumber];
    if (!createRecord) throw new Error('Invalid table');

    // Minimal record creation
    const savedRecord = await createRecord({
        userId,
        username: firstName + ' ' + lastName,
        value: firstName[0].toUpperCase()
    });

    // Update tracking in background
    setImmediate(() => {
        TrackingTable.create({
            userId,
            username: savedRecord.username,
            value: savedRecord.value,
            tableNumber
        }).catch(() => {});  // Ignore tracking errors
    });

    return { tableNumber, savedRecord };
};

const generateAccessToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn:"15m"});
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn:'7d'});
};

module.exports = {
    getTableNumber,
    saveUserToTable,
    generateAccessToken,
    generateRefreshToken
};
