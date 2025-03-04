 
const express = require('express');
const { getTableRecords, trackUserEntry } = require('../controllers/tableController');

const router = express.Router();

router.get('/records/:tableNumber', getTableRecords);
router.post('/track', trackUserEntry);

module.exports = router;
