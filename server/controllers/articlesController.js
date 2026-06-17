const Article = require('../models/Article');
const Category = require('../models/Category');

const listArticles = async (req, res) => {
    try {
        const articles = await Article.findAll({
            include: [{ model: Category, attributes: ['id', 'nom', 'taux_tva'] }],
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json(articles);
    } catch (error) {
        console.error('List articles error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des articles.' });
    }
};

const getArticle = async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id, {
            include: [{ model: Category, attributes: ['id', 'nom', 'taux_tva'] }]
        });

        if (!article) {
            return res.status(404).json({ message: 'Article introuvable.' });
        }

        return res.status(200).json(article);
    } catch (error) {
        console.error('Get article error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération de l’article.' });
    }
};

const createArticle = async (req, res) => {
    try {
        const { designation, prix_unitaire, categorie_id, actif } = req.body;

        if (!designation || prix_unitaire === undefined || prix_unitaire === null) {
            return res.status(400).json({ message: 'designation et prix_unitaire sont obligatoires.' });
        }

        if (categorie_id) {
            const category = await Category.findByPk(categorie_id);
            if (!category) {
                return res.status(400).json({ message: 'categorie_id invalide.' });
            }
        }

        const article = await Article.create({
            designation,
            prix_unitaire,
            categorie_id: categorie_id || null,
            actif: actif ?? true
        });

        return res.status(201).json({ message: 'Article créé avec succès.', article });
    } catch (error) {
        console.error('Create article error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la création de l’article.' });
    }
};

const updateArticle = async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);

        if (!article) {
            return res.status(404).json({ message: 'Article introuvable.' });
        }

        if (req.body.categorie_id) {
            const category = await Category.findByPk(req.body.categorie_id);
            if (!category) {
                return res.status(400).json({ message: 'categorie_id invalide.' });
            }
        }

        await article.update(req.body);

        return res.status(200).json({ message: 'Article mis à jour avec succès.', article });
    } catch (error) {
        console.error('Update article error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de l’article.' });
    }
};

const deleteArticle = async (req, res) => {
    try {
        const article = await Article.findByPk(req.params.id);

        if (!article) {
            return res.status(404).json({ message: 'Article introuvable.' });
        }

        await article.destroy();

        return res.status(200).json({ message: 'Article supprimé avec succès.' });
    } catch (error) {
        console.error('Delete article error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la suppression de l’article.' });
    }
};

module.exports = {
    listArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle
};