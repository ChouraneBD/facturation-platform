const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listParametres,
  getParametre,
  upsertParametre
} = require('../controllers/parametresController');

const router = express.Router();

router.use(protect);
router.get('/', listParametres);
router.get('/:cle', getParametre);
router.put('/', authorizeRoles('admin'), upsertParametre);
router.post('/', authorizeRoles('admin'), upsertParametre);

module.exports = router;
