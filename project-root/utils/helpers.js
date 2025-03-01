const { Table1, Table2, Table3 } = require('../models/tableModel');
const TrackingTable = require('../models/trackingModel');

// 📌 Get table number based on first letter of the first name
const getTableNumber = (alphabet) => {
    if (!alphabet || typeof alphabet !== 'string') {
        console.error(`Invalid input: "${alphabet}". Expected a single character.`);
        return null;
    }

    const charCode = alphabet.charCodeAt(0);
    if (charCode >= 65 && charCode <= 90) { // A-Z
        if (charCode <= 73) return 1; // A-I
        if (charCode <= 82) return 2; // J-R
        return 3; // S-Z
    }

    console.error(`Input "${alphabet}" is not a valid uppercase letter.`);
    return null;
};

// 📌 Save User to the Correct Table
const saveUserToTable = async (user) => {
    const { firstName, lastName, _id: userId } = user;

    if (!firstName) {
        throw new Error('First name is required to determine table number.');
    }

    const fullName = `${firstName} ${lastName}`;
    const alphabet = firstName.charAt(0).toUpperCase();
    const tableNumber = getTableNumber(alphabet);

    if (!tableNumber) {
        throw new Error(`Failed to map "${alphabet}" to a valid table.`);
    }

    let savedRecord;
    switch (tableNumber) {
        case 1:
            savedRecord = await Table1.create({ userId, username: fullName, value: alphabet });
            break;
        case 2:
            savedRecord = await Table2.create({ userId, username: fullName, value: alphabet });
            break;
        case 3:
            savedRecord = await Table3.create({ userId, username: fullName, value: alphabet });
            break;
        default:
            throw new Error('Unexpected table number.');
    }

    await TrackingTable.create({
        userId,
        username: fullName,
        tableNumber,
        value: alphabet,
    });

    return { tableNumber, savedRecord };
};

module.exports = { getTableNumber, saveUserToTable };
