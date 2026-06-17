const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoriesController');

const router = express.Router();

router.use(protect);

router.get('/', listCategories);
router.get('/:id', getCategory);
router.post('/', authorizeRoles('admin'), createCategory);
router.put('/:id', authorizeRoles('admin'), updateCategory);
router.delete('/:id', authorizeRoles('admin'), deleteCategory);

module.exports = router;