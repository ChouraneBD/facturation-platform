const Parametre = require('../models/Parametre');

const listParametres = async (req, res) => {
    try {
        const parametres = await Parametre.findAll({ order: [['cle', 'ASC']] });
        return res.status(200).json(parametres);
    } catch (error) {
        console.error('List parametres error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des paramètres.' });
    }
};

const getParametre = async (req, res) => {
    try {
        const parametre = await Parametre.findOne({ where: { cle: req.params.cle } });

        if (!parametre) {
            return res.status(404).json({ message: 'Paramètre introuvable.' });
        }

        return res.status(200).json(parametre);
    } catch (error) {
        console.error('Get parametre error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération du paramètre.' });
    }
};

const upsertParametre = async (req, res) => {
    try {
        const { cle, valeur, description } = req.body;

        if (!cle || valeur === undefined || valeur === null) {
            return res.status(400).json({ message: 'cle et valeur sont obligatoires.' });
        }

        const [parametre, created] = await Parametre.findOrCreate({
            where: { cle },
            defaults: { valeur, description: description || null }
        });

        if (!created) {
            await parametre.update({ valeur, description: description ?? parametre.description });
        }

        return res.status(created ? 201 : 200).json({
            message: created ? 'Paramètre créé avec succès.' : 'Paramètre mis à jour avec succès.',
            parametre: created ? parametre : await Parametre.findOne({ where: { cle } })
        });
    } catch (error) {
        console.error('Upsert parametre error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du paramètre.' });
    }
};

module.exports = {
    listParametres,
    getParametre,
    upsertParametre
};