const mongoose = require('mongoose');

// State Schema
const stateSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true, 
        unique: true 
    }
});

// District Schema
const districtSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    state: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'State', 
        required: true 
    }
});

// Village Schema
const villageSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    district: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'District', 
        required: true 
    }
});

// Gram Panchayat Schema
const gpSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    village: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Village', 
        required: true 
    }
});

// Department Schema
const departmentSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    state: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'State', 
        required: true 
    },
    district: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'District', 
        required: true 
    },
    village: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Village', 
        required: false 
    },
    gp: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'GramPanchayat', 
        required: false 
    }
});

const State = mongoose.model('State', stateSchema);
const District = mongoose.model('District', districtSchema);
const Village = mongoose.model('Village', villageSchema);
const GramPanchayat = mongoose.model('GramPanchayat', gpSchema);
const Department = mongoose.model('Department', departmentSchema);

module.exports = {
    State,
    District,
    Village,
    GramPanchayat,
    Department
}; 