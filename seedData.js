const mongoose = require('mongoose');
const path = require('path');  // ✅ Import missing path module
const District = require('./models/District'); 
const Village = require('./models/Village');
const State = require('./models/State');
const Department = require('./models/Department');

require("dotenv").config({ path: path.join(__dirname, ".env") });

const seedData = async () => {
    try {
        // ✅ Reuse existing connection
      

        // Predefined data
        const statesData = [
            { name: 'State 1' },
            { name: 'State 2' },
            { name: 'State 3' },
            { name: 'State 4' },
            { name: 'State 5' }
        ];

        const insertedStates = await State.insertMany(statesData);
        console.log("✅ States Inserted");

        // Mapping state names to _ids
        const stateMap = {};
        insertedStates.forEach(state => {
            stateMap[state.name] = state._id;
        });

        const districtsData = [
            { name: 'District 1', state: stateMap['State 1'] },
            { name: 'District 2', state: stateMap['State 2'] },
            { name: 'District 3', state: stateMap['State 3'] },
            { name: 'District 4', state: stateMap['State 4'] },
            { name: 'District 5', state: stateMap['State 5'] }
        ];

        const insertedDistricts = await District.insertMany(districtsData);
        console.log("✅ Districts Inserted");

        // Mapping district names to _ids
        const districtMap = {};
        insertedDistricts.forEach(district => {
            districtMap[district.name] = district._id;
        });

        const villagesData = [
            { name: 'Village 1', district: districtMap['District 1'] },
            { name: 'Village 2', district: districtMap['District 2'] },
            { name: 'Village 3', district: districtMap['District 3'] },
            { name: 'Village 4', district: districtMap['District 4'] },
            { name: 'Village 5', district: districtMap['District 5'] }
        ];

        await Village.insertMany(villagesData);
        console.log("✅ Villages Inserted");

        const departmentsData = [
            { name: 'Department 1' },
            { name: 'Department 2' },
            { name: 'Department 3' },
            { name: 'Department 4' },
            { name: 'Department 5' }
        ];

        await Department.insertMany(departmentsData);
        console.log("✅ Departments Inserted");

        console.log("🎉 Data seeded successfully!");
    } catch (error) {
        console.error("❌ Error inserting predefined data:", error.message);
    } finally {
        if (mongoose.connection.readyState === 1) {
            console.log("🔌 Closing MongoDB connection after seeding...");
            mongoose.connection.close();
        }
    }
};

seedData();
