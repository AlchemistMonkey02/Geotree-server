const express = require('express');
const mongoose = require('mongoose');
const { insertPredefinedData } = require('./path/to/your/insertFunctionFile'); // Adjust the path accordingly

const app = express();
const PORT = process.env.PORT || 3000;

// Existing middleware and routes...

// 🚀 New endpoint to insert predefined data
app.post('/insert-predefined-data', async (req, res) => {
    try {
        await insertPredefinedData();
        res.status(200).send("✅ Predefined data inserted successfully!");
    } catch (err) {
        console.error("❌ Error inserting predefined data:", err);
        res.status(500).send("❌ Error inserting predefined data.");
    }
});

// Existing server start code...
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 