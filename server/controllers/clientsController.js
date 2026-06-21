const Client = require('../models/Client');
const { canAccessClient, clientScopeWhere, isAdmin } = require('../utils/accessScope');

const listClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      where: clientScopeWhere(req.user),
      order: [['created_at', 'DESC']]
    });
    return res.status(200).json(clients);
  } catch (error) {
    console.error('List clients error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des clients.' });
  }
};

const getClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client introuvable.' });
    }

    if (!canAccessClient(req.user, client)) {
      return res.status(403).json({ message: 'Accès interdit à ce client.' });
    }

    return res.status(200).json(client);
  } catch (error) {
    console.error('Get client error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération du client.' });
  }
};

const createClient = async (req, res) => {
  try {
    const { nom, email, tel, adresse, ville } = req.body;

    if (!nom) {
      return res.status(400).json({ message: 'Le champ nom est obligatoire.' });
    }

    if (!isAdmin(req.user)) {
      if (email && email !== req.user.email) {
        return res.status(403).json({ message: 'Vous ne pouvez créer un profil client que pour votre propre compte.' });
      }

      const existingClient = await Client.findOne({ where: { email: req.user.email } });
      if (existingClient) {
        return res.status(409).json({ message: 'Un profil client existe déjà pour votre compte.' });
      }
    }

    const client = await Client.create({
      nom,
      email: isAdmin(req.user) ? email : req.user.email,
      tel,
      adresse,
      ville
    });

    return res.status(201).json({ message: 'Client créé avec succès.', client });
  } catch (error) {
    console.error('Create client error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la création du client.' });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client introuvable.' });
    }

    if (!canAccessClient(req.user, client)) {
      return res.status(403).json({ message: 'Accès interdit à ce client.' });
    }

    if (!isAdmin(req.user)) {
      const { email, ...allowedFields } = req.body;
      if (email && email !== req.user.email) {
        return res.status(403).json({ message: 'Vous ne pouvez pas modifier l\'email d\'un autre utilisateur.' });
      }
      await client.update({ ...allowedFields, email: req.user.email });
      await client.reload();
      return res.status(200).json({ message: 'Client mis à jour avec succès.', client });
    }

    await client.update(req.body);

    return res.status(200).json({ message: 'Client mis à jour avec succès.', client });
  } catch (error) {
    console.error('Update client error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du client.' });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findByPk(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client introuvable.' });
    }

    await client.destroy();

    return res.status(200).json({ message: 'Client supprimé avec succès.' });
  } catch (error) {
    console.error('Delete client error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la suppression du client.' });
  }
};

module.exports = {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient
};
