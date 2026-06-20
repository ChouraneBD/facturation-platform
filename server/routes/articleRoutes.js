const express = require('express');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle
} = require('../controllers/articlesController');

const router = express.Router();

router.get('/', listArticles);
router.get('/:id', getArticle);
router.use(protect);
router.post('/', authorizeRoles('admin'), createArticle);
router.put('/:id', authorizeRoles('admin'), updateArticle);
router.delete('/:id', authorizeRoles('admin'), deleteArticle);

module.exports = router;
