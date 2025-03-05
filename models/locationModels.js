// Function to generate a custom unique ID with a prefix in uppercase

const mongoose = require('mongoose');

const generateUniqueId = (prefix) => {
    return `${prefix.toUpperCase()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

// ✅ State Schema
const stateSchema = new mongoose.Schema({
    state_id: { type: String, required: true, unique: true, default: () => generateUniqueId('STATE_ID') }, 
    name: { type: String, required: true, unique: true }
});
const State = mongoose.model('State', stateSchema);

// ✅ District Schema
const districtSchema = new mongoose.Schema({
    district_id: { type: String, required: true, unique: true, default: () => generateUniqueId('DISTRICT_ID') }, 
    name: { type: String, required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true }
});
const District = mongoose.model('District', districtSchema);

// ✅ Village Schema
const villageSchema = new mongoose.Schema({
    village_id: { type: String, required: true, unique: true, default: () => generateUniqueId('VILLAGE_ID') }, 
    name: { type: String, required: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true }
});
const Village = mongoose.model('Village', villageSchema);

// ✅ Gram Panchayat Schema
const gpSchema = new mongoose.Schema({
    gp_id: { type: String, required: true, unique: true, default: () => generateUniqueId('GP_ID') }, 
    name: { type: String, required: true },
    village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: true }
});
const GramPanchayat = mongoose.model('GramPanchayat', gpSchema);

// ✅ Department Schema
const departmentSchema = new mongoose.Schema({
    department_id: { type: String, required: true, unique: true, default: () => generateUniqueId('DEPARTMENT_ID') }, 
    name: { type: String, required: true },
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
    district: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
    village: { type: mongoose.Schema.Types.ObjectId, ref: 'Village', required: false },
    gp: { type: mongoose.Schema.Types.ObjectId, ref: 'GramPanchayat', required: false }
});
const Department = mongoose.model('Department', departmentSchema);

module.exports = { State, District, Village, GramPanchayat, Department };
