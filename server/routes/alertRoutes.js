const { protect } = require('../middleware/authMiddleware');
const { listAlerts, markAlertRead } = require('../services/alertService');

const router = require('express').Router();

router.get('/', protect, listAlerts);
router.patch('/:id/read', protect, markAlertRead);

module.exports = router;
