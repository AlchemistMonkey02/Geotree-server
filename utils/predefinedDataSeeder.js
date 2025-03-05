const mongoose = require('mongoose');
const { State, District, Village, GramPanchayat, Department } = require('../models/locationModels');
const Plant = require('../models/plantModel');
const LandOwnership = require('../models/landOwnershipModel');

// ✅ Function to check and reuse the existing database connection
const connectDB = async () => {
    if (mongoose.connection.readyState === 1) {
        console.log("🔄 Using existing MongoDB connection.");
        return;
    }
    console.log("📌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB.");
};

// 🚀 Function to insert predefined location data
const insertPredefinedData = async () => {
    try {
        await connectDB(); // Ensure DB connection before inserting

        console.log("📌 Inserting predefined location data...");

        // Insert States
        const stateNames = Array.from({ length: 2 }, (_, i) => ({ name: `State ${i + 1}` }));
        const states = await State.insertMany(stateNames);
        console.log("✅ 10 States Inserted");

        // Insert Districts
        let districts = [];
        states.forEach(state => {
            for (let i = 1; i <= 2; i++) {
                districts.push({ name: `District ${i} of ${state.name}`, state: state._id });
            }
        });
        const insertedDistricts = await District.insertMany(districts);
        console.log("✅ 100 Districts Inserted (10 per state)");

        // Insert Villages
        let villages = [];
        insertedDistricts.forEach(district => {
            for (let i = 1; i <= 2; i++) {
                villages.push({ name: `Village ${i} of ${district.name}`, district: district._id });
            }
        });
        const insertedVillages = await Village.insertMany(villages);
        console.log("✅ 1000 Villages Inserted (10 per district)");

        // Insert Gram Panchayats
        let gps = [];
        insertedVillages.forEach(village => {
            for (let i = 1; i <= 2; i++) {
                gps.push({ name: `GP ${i} of ${village.name}`, village: village._id });
            }
        });
        await GramPanchayat.insertMany(gps);
        console.log("✅ 10000 Gram Panchayats Inserted (10 per village)");

        // Insert Departments
        let departments = [];
        insertedDistricts.forEach(district => {
            for (let i = 1; i <= 2; i++) {
                departments.push({
                    name: `Department ${i} of ${district.name}`,
                    state: district.state,
                    district: district._id
                });
            }
        });
        await Department.insertMany(departments);
        console.log("✅ 1000 Departments Inserted (10 per district)");

        console.log("🎉 Predefined location data inserted successfully!");
    } catch (err) {
        console.error("❌ Error inserting predefined data:", err.message);
    }
};

// 🚀 Function to insert predefined plant data
const insertPlantData = async () => {
    try {
        await connectDB(); // Ensure DB connection before inserting

        console.log("📌 Inserting predefined plant data...");

        const plantNames = Array.from({ length: 10 }, (_, i) => ({
            plant_id: `plnt${i}`,  // Custom unique plant_id
            name: `Plant ${i + 1}`
        }));

        for (const plant of plantNames) {
            await Plant.updateOne(
                { plant_id: plant.plant_id },  // Check by plant_id
                { $setOnInsert: plant },  // Insert only if it doesn't exist
                { upsert: true } // Create if not found
            );
        }

        console.log("✅ Plants inserted successfully (avoiding duplicates).");
    } catch (err) {
        console.error("❌ Error inserting plant data:", err.message);
    }
};


// 🚀 Function to insert predefined land ownership data
const insertLandOwnershipData = async () => {
    try {
        await connectDB(); // Ensure database connection

        console.log("📌 Inserting predefined land ownership data...");
        
        const landOwnershipData = [
            { ownershipType: 'PRIVATE' },
            { ownershipType: 'GOVERNMENT' },
            { ownershipType: 'COMMUNITY' },
            { ownershipType: 'CORPORATE' },
            { ownershipType: 'PANCHAYAT' }
        ];

        // Prevent duplicate entries
        const existingRecords = await LandOwnership.find({ ownershipType: { $in: landOwnershipData.map(d => d.ownershipType) } });
        if (existingRecords.length === landOwnershipData.length) {
            console.log("⚠️ Ownership types already exist. Skipping insertion.");
            return;
        }

        await LandOwnership.insertMany(landOwnershipData);
        console.log("✅ 5 Land Ownership Records Inserted");
    } catch (err) {
        console.error("❌ Error inserting land ownership data:", err.message);
    } finally {
        mongoose.connection.close(); // Close connection after inserting
    }
};

module.exports = { insertPredefinedData, insertPlantData, insertLandOwnershipData };
