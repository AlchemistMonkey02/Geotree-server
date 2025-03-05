const express = require("express");
const router = express.Router();
const nurseryController = require("../controllers/nurseryController");

// CRUD routes for nursery
router.post("/", nurseryController.createNursery); // Create a new nursery
router.get("/", nurseryController.getAllNurseries); // Get all nurseries
router.get("/:id", nurseryController.getNurseryById); // Get a nursery by ID
router.put("/:id", nurseryController.updateNursery); // Update a nursery
router.delete("/:id", nurseryController.deleteNursery); // Delete a nursery

module.exports = router; 