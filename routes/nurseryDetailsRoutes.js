const express = require("express");
const router = express.Router();
const nurseryDetailsController = require("../controllers/nurseryDetailsController");

// Define routes for NurseryDetails
router.post("/", nurseryDetailsController.createNurseryDetails);
router.get("/", nurseryDetailsController.getAllNurseryDetails);
router.get("/:id", nurseryDetailsController.getNurseryDetailsById);
router.put("/:id", nurseryDetailsController.updateNurseryDetails);
router.delete("/:id", nurseryDetailsController.deleteNurseryDetails);

module.exports = router; 