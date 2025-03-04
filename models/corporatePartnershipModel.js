const mongoose = require('mongoose');

const corporateSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    program: { type: String, required: true, enum: ["Corporate Forest Initiative", "Green Team Program"] },
    employeesInvolved: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("CorporatePartnership", corporateSchema);
