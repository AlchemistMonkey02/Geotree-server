const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, ref: 'User' },
    username: { type: String, required: true },
    value: { type: String, required: true },
}, { timestamps: true });

const Table1 = mongoose.models.Table1 || mongoose.model('Table1', tableSchema);
const Table2 = mongoose.models.Table2 || mongoose.model('Table2', tableSchema);
const Table3 = mongoose.models.Table3 || mongoose.model('Table3', tableSchema);

module.exports = { Table1, Table2, Table3 };
