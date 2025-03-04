const mongoose = require('mongoose');

// ✅ State Schema
const stateSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }
});
const State = mongoose.model('State', stateSchema);

// ✅ District Schema
const districtSchema = new mongoose.Schema({
    name: { type: String, required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true }
});
const District = mongoose.model('District', districtSchema);

// ✅ Village Schema
const villageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true }
});
const Village = mongoose.model('Village', villageSchema);

// ✅ Gram Panchayat Schema
const gpSchema = new mongoose.Schema({
    name: { type: String, required: true },
    village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true }
});
const GramPanchayat = mongoose.model('GramPanchayat', gpSchema);

// ✅ Department Schema
const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
    village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: false },
    gp: { type: mongoose.Schema.Types.ObjectId, ref: 'GramPanchayat', required: false }
});
const Department = mongoose.model('Department', departmentSchema);

module.exports = { State, District, Village, GramPanchayat, Department };
