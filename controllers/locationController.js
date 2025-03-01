const { State, District, Village, GramPanchayat, Department } = require('../models/locationModels');

// Get all states
exports.getAllStates = async (req, res) => {
    try {
        const states = await State.find().sort('name');
        res.status(200).json({
            status: 'success',
            data: states
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get districts by state
exports.getDistrictsByState = async (req, res) => {
    try {
        const { stateId } = req.params;
        const districts = await District.find({ state: stateId }).sort('name');
        res.status(200).json({
            status: 'success',
            data: districts
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get villages by district
exports.getVillagesByDistrict = async (req, res) => {
    try {
        const { districtId } = req.params;
        const villages = await Village.find({ district: districtId }).sort('name');
        res.status(200).json({
            status: 'success',
            data: villages
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get GPs by village
exports.getGPsByVillage = async (req, res) => {
    try {
        const { villageId } = req.params;
        const gps = await GramPanchayat.find({ village: villageId }).sort('name');
        res.status(200).json({
            status: 'success',
            data: gps
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get departments by location
exports.getDepartments = async (req, res) => {
    try {
        const { stateId, districtId, villageId, gpId } = req.query;
        
        let filter = {};
        if (stateId) filter.state = stateId;
        if (districtId) filter.district = districtId;
        if (villageId) filter.village = villageId;
        if (gpId) filter.gp = gpId;

        const departments = await Department.find(filter)
            .sort('name')
            .populate('state district village gp');

        res.status(200).json({
            status: 'success',
            data: departments
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create state
exports.createState = async (req, res) => {
    try {
        const state = await State.create(req.body);
        res.status(201).json({
            status: 'success',
            data: state
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create district
exports.createDistrict = async (req, res) => {
    try {
        const district = await District.create(req.body);
        res.status(201).json({
            status: 'success',
            data: district
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create village
exports.createVillage = async (req, res) => {
    try {
        const village = await Village.create(req.body);
        res.status(201).json({
            status: 'success',
            data: village
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create GP
exports.createGP = async (req, res) => {
    try {
        const gp = await GramPanchayat.create(req.body);
        res.status(201).json({
            status: 'success',
            data: gp
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create department
exports.createDepartment = async (req, res) => {
    try {
        const department = await Department.create(req.body);
        res.status(201).json({
            status: 'success',
            data: department
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: error.message
        });
    }
}; 