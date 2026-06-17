const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getMetrics } = require('../controllers/dashboardController');

const router = express.Router();

router.use(protect);

router.get('/metrics', getMetrics);

module.exports = router;