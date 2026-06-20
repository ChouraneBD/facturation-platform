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

const defaultParametres = [
  { cle: 'societe_nom', valeur: 'Factora', description: 'Nom de la société affiché sur les PDF' },
  { cle: 'societe_tagline', valeur: 'Gestion de facturation professionnelle', description: 'Sous-titre entreprise' },
  { cle: 'societe_adresse', valeur: '123 Avenue des Technologies, Casablanca', description: 'Adresse entreprise' },
  { cle: 'societe_email', valeur: 'contact@factora.ma', description: 'Email de contact' },
  { cle: 'societe_telephone', valeur: '+212 5 22 00 00 00', description: 'Téléphone entreprise' },
  { cle: 'devise', valeur: 'MAD', description: 'Devise par défaut (EUR, MAD, USD)' },
  { cle: 'logo_base64', valeur: '', description: 'Logo entreprise encodé en base64 (data URL)' }
];

const legacyBrandValues = {
  societe_nom: ['TechPro Services'],
  societe_tagline: ['EMSI Casablanca — Facturation Platform'],
  societe_email: ['contact@techpro-services.ma']
};

const seedDefaultParametres = async () => {
  for (const param of defaultParametres) {
    const [record, created] = await Parametre.findOrCreate({
      where: { cle: param.cle },
      defaults: { valeur: param.valeur, description: param.description }
    });

    if (!created) {
      const legacyValues = legacyBrandValues[param.cle];
      if (legacyValues?.includes(record.valeur)) {
        await record.update({ valeur: param.valeur, description: param.description });
      }
    }
  }
};

module.exports = {
  listParametres,
  getParametre,
  upsertParametre,
  seedDefaultParametres
};
