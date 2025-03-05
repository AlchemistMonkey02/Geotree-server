const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    // other fields...
});

module.exports = mongoose.model("Plant", plantSchema); 