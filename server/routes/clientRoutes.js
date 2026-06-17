const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    listClients,
    getClient,
    createClient,
    updateClient,
    deleteClient
} = require('../controllers/clientsController');

const router = express.Router();

router.use(protect);

router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', createClient);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router;