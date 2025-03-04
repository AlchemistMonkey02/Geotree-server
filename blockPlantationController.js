const mongoose = require('mongoose');
const District = require('./models/District'); // Adjust the path as necessary
const Village = require('./models/Village');   // Adjust the path as necessary
const State = require('./models/State');       // Adjust the path as necessary
const Department = require('./models/Department'); // Adjust the path as necessary

// Other existing controller methods...

const seedData = async (req, res) => {
    try {
        await mongoose.connect('mongodb://localhost:27017/yourDatabaseName', { useNewUrlParser: true, useUnifiedTopology: true });

        // Predefined data
        const statesData = [
            { name: 'State 1' }, { name: 'State 2' }, { name: 'State 3' },
            { name: 'State 4' }, { name: 'State 5' }, { name: 'State 6' },
            { name: 'State 7' }, { name: 'State 8' }, { name: 'State 9' }, { name: 'State 10' }
        ];
        
        const savedStates = await State.insertMany(statesData);

        const districtsData = savedStates.map((state, index) => ({
            name: `District ${index + 1}`,
            state: state._id
        }));
        const savedDistricts = await District.insertMany(districtsData);

        const villagesData = savedDistricts.map((district, index) => ({
            name: `Village ${index + 1}`,
            district: district._id
        }));
        const savedVillages = await Village.insertMany(villagesData);

        const departmentsData = savedDistricts.map((district, index) => ({
            name: `Department ${index + 1}`,
            state: district.state,
            district: district._id
        }));
        await Department.insertMany(departmentsData);

        console.log('Data seeded successfully!');
        res.status(200).json({ message: 'Data seeded successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error seeding data', error: err });
    } finally {
        mongoose.connection.close();
    }
};

// Export the controller methods
module.exports = {
    // Other exports...
    seedData
}; 