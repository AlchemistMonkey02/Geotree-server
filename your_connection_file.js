const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState === 0) { // 0 means disconnected
        await mongoose.connect('your_connection_string', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
};

module.exports = connectDB; 