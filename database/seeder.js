// Predefined data
const predefinedDepartments = [
    { name: 'HR' },
    { name: 'Finance' },
    { name: 'IT' },
    { name: 'Marketing' },
    { name: 'Sales' },
    { name: 'Operations' },
    { name: 'Customer Service' },
    { name: 'Legal' },
    { name: 'Research and Development' },
    { name: 'Logistics' }
];

const predefinedStates = [
    { name: 'State 1' },
    { name: 'State 2' },
    { name: 'State 3' },
    { name: 'State 4' },
    { name: 'State 5' },
    { name: 'State 6' },
    { name: 'State 7' },
    { name: 'State 8' },
    { name: 'State 9' },
    { name: 'State 10' }
];

const predefinedDistricts = [];
for (let i = 1; i <= 1010; i++) {
    predefinedDistricts.push({ name: `District ${i}`, stateId: Math.ceil(Math.random() * 10) }); // Randomly assign stateId from 1 to 10
}

function seedDepartments() {
    // Insert predefined departments into the database
    // db.departments.insertMany(predefinedDepartments);
}

function seedDistricts() {
    // Insert predefined districts into the database
    // db.districts.insertMany(predefinedDistricts);
}

function seedStates() {
    // Insert predefined states into the database
    // db.states.insertMany(predefinedStates);
}

// Call the seed functions
function seedDatabase() {
    seedDepartments();
    seedStates();
    seedDistricts();
}

// Execute the seeding process
seedDatabase(); 