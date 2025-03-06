// Load environment variables first
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const net = require("net");

// ✅ Import Middlewares
const {
  authenticateToken,
  refreshTokenMiddleware,
} = require("./middlewares/authMiddleware");
const { authorizeRoles, isOriginalAdmin } = require("./middlewares/roleMiddleware");
const { generalLimiter, loginLimiter } = require("./middlewares/rateLimiter");
const masterApiKeyMiddleware = require("./middlewares/masterApiKeyMiddleware");
const apiKeyUsageMiddleware = require("./middlewares/apiKeyUsageMiddleware");

// ✅ Import Routes
const userRoutes = require("./routes/userRoutes");
const tableRoutes = require("./routes/tableRoutes");
const blockPlantationRoutes = require("./routes/blockPlantationRoutes");
const plantationRoutes = require("./routes/plantationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const treeCategoryRoutes = require("./routes/treeCategoryRoutes");
const eventRoutes = require("./routes/eventRoutes");
const corporateRoutes = require("./routes/corporateRoutes");
const educationRoutes = require("./routes/educationRoutes");
const userHistoryRoutes = require("./routes/userHistoryRoutes");
const activityRoutes = require("./routes/activityRoutes");
const treePlantationRoutes = require("./routes/treePlantationRoutes");
const locationRoutes = require("./routes/locationRoutes");
const landOwnershipRoutes = require("./routes/landOwnershipRoutes");
const combinedPlantationRoutes = require("./routes/combinedPlantationRoutes");
const { insertPredefinedData, insertPlantData, insertLandOwnershipData } = require("./utils/predefinedDataSeeder");
const plantRoutes = require('./routes/plantRoutes');
const individualPlantationRoutes = require('./routes/individualPlantationRoutes');
const predefinedRoutes = require("./routes/predefinedRoutes");
const nurseryRoutes = require("./routes/nurseryRoutes");
const nurseryDetailsRoutes = require("./routes/nurseryDetailsRoutes");
const organizationRoutes = require('./routes/organizationRoutes');
const apiKeyRoutes = require("./routes/apiKeyRoutes");
const apiKeyAdminRoutes = require("./routes/apiKeyAdminRoutes");

const app = express();

// ✅ Middleware


// ✅ Trust the first proxy (important for rate limiting & IP tracking)
app.set('trust proxy', 1);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(generalLimiter);
app.use(masterApiKeyMiddleware);
app.use(apiKeyUsageMiddleware);

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
      console.log("🔄 Already connected to MongoDB.");
      return;
  }

  try {
      console.log("📌 Connecting to MongoDB...");
      await mongoose.connect(process.env.MONGO_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          family: 4,
      });
      console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
      console.error("❌ MongoDB Connection Error:", error.message);
      console.log("🔄 Retrying connection in 5 seconds...");
      setTimeout(connectDB, 5000);
  }
};

// ✅ Connect to database at startup
connectDB();

// ✅ Define Routes
app.use("/api/users", userRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/blockPlantation", blockPlantationRoutes);
app.use("/api/plantation", plantationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/tree-categories", treeCategoryRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/corporate", corporateRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/history", userHistoryRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/tree-plantations", treePlantationRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/land-ownership", landOwnershipRoutes);
app.use("/api/combined-plantations", combinedPlantationRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/block-plantations", blockPlantationRoutes);
app.use("/api/individual-plantations", individualPlantationRoutes);
// predefined

app.use("/api/predefined", predefinedRoutes);
app.use("/api/nurseries", nurseryRoutes);
app.use("/api/nursery-details", nurseryDetailsRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/api-keys", apiKeyRoutes);
app.use("/api/admin/api-keys", apiKeyAdminRoutes);

// ✅ Refresh Token Route
app.post("/api/refresh-token", refreshTokenMiddleware);

// ✅ Health Check Route
app.get("/", (req, res) => {
  res.status(200).json({ message: "🌿 API is running successfully!" });
});

// ✅ Enhanced Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);

  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "error",
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      status: "error",
      message: "Invalid token",
    });
  }

  if (err.status === 429) {
    return res.status(429).json({
      status: "error",
      message: "Too many requests. Please try again later.",
    });
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ✅ Unhandled Rejection Handler
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// ✅ Uncaught Exception Handler
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// ✅ Port Management
const DEFAULT_PORT = 6068;
const HOST = "0.0.0.0"; // Allows external access

/**
 * Function to find an available port
 * @param {number} startPort - Starting port to check
 * @param {number} maxAttempts - Maximum number of ports to try
 * @returns {Promise<number>}
 */
const findAvailablePort = (startPort = DEFAULT_PORT, maxAttempts = 10) => {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkPort = (port) => {
      const server = net.createServer();

      server.once("error", (err) => {
        if (err.code === "EADDRINUSE" && attempts < maxAttempts) {
          attempts++;
          checkPort(port + 1);
        } else {
          reject(new Error("No available ports found!"));
        }
      });

      server.once("listening", () => {
        server.close(() => resolve(port));
      });

      server.listen(port);
    };

    checkPort(startPort);
  });
};

// Start the server on an available port
(async () => {
  try {
    const port = await findAvailablePort(DEFAULT_PORT);
    app.listen(port, HOST, () => {
      console.log(`🌍 Server running on http://${HOST}:${port}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
  }
})();


