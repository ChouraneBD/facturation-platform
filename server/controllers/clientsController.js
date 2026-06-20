const Client = require('../models/Client');

const listClients = async (req, res) => {
  try {
    const clients = await Client.findAll({ order: [['created_at', 'DESC']] });
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

    const client = await Client.create({ nom, email, tel, adresse, ville });

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
