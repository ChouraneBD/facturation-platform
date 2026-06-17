const Category = require('../models/Category');

const defaultCategories = [
    { nom: 'Informatique', taux_tva: 20.00 },
    { nom: 'Services', taux_tva: 10.00 },
    { nom: 'Formation', taux_tva: 0.00 },
    { nom: 'Fournitures', taux_tva: 20.00 }
];

const listCategories = async (req, res) => {
    try {
        const categories = await Category.findAll({ order: [['nom', 'ASC']] });
        return res.status(200).json(categories);
    } catch (error) {
        console.error('List categories error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des catégories.' });
    }
};

const getCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Catégorie introuvable.' });
        }

        return res.status(200).json(category);
    } catch (error) {
        console.error('Get category error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération de la catégorie.' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { nom, taux_tva } = req.body;

        if (!nom) {
            return res.status(400).json({ message: 'Le champ nom est obligatoire.' });
        }

        const category = await Category.create({
            nom,
            taux_tva: taux_tva ?? 20.00
        });

        return res.status(201).json({ message: 'Catégorie créée avec succès.', category });
    } catch (error) {
        console.error('Create category error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la création de la catégorie.' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Catégorie introuvable.' });
        }

        await category.update(req.body);

        return res.status(200).json({ message: 'Catégorie mise à jour avec succès.', category });
    } catch (error) {
        console.error('Update category error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la catégorie.' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Catégorie introuvable.' });
        }

        await category.destroy();

        return res.status(200).json({ message: 'Catégorie supprimée avec succès.' });
    } catch (error) {
        console.error('Delete category error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la suppression de la catégorie.' });
    }
};

const seedDefaultCategories = async () => {
    await Promise.all(
        defaultCategories.map((category) =>
            Category.findOrCreate({
                where: { nom: category.nom },
                defaults: category
            })
        )
    );
};

module.exports = {
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    seedDefaultCategories
};