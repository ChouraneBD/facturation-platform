const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { listAlerts, markAlertRead } = require('../services/alertService');

const router = express.Router();

router.use(protect);
router.get('/', listAlerts);
router.patch('/:id/read', markAlertRead);

module.exports = router;
