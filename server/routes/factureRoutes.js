const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
    listFactures,
    getFacture,
    createFacture,
    updateGlobalDiscount,
    updateStatus,
    validateInvoice,
    sendInvoiceEmail,
    verifyFacture
} = require('../controllers/facturesController');

const router = express.Router();

router.get('/verify/:numero', verifyFacture);

router.use(protect);

router.get('/', listFactures);
router.get('/:id', getFacture);
router.post('/', createFacture);
router.patch('/:id/remise-globale', updateGlobalDiscount);
router.patch('/:id/statut', authorizeRoles('user', 'admin'), updateStatus);
router.patch('/:id/validation', authorizeRoles('admin'), validateInvoice);
router.post('/:id/send-email', authorizeRoles('admin', 'user'), sendInvoiceEmail);

module.exports = router;