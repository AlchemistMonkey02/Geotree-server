const express = require('express');
const app = express();
const predefinedRoutes = require("./routes/predefinedRoutes");

// Middleware to parse JSON requests
app.use(express.json());

// 🚀 Use predefined routes
app.use('/api', predefinedRoutes);

// ... other middleware and route definitions 