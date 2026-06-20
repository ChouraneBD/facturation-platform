const { Op, fn, col } = require('sequelize');
const Facture = require('../models/Facture');
const Client = require('../models/Client');
const LigneFacture = require('../models/LigneFacture');
const User = require('../models/User');
const Article = require('../models/Article');

const buildDateFilter = (from, to, annee) => {
  if (annee) {
    const year = Number(annee);
    return {
      created_at: {
        [Op.gte]: new Date(`${year}-01-01`),
        [Op.lte]: new Date(`${year}-12-31T23:59:59`)
      }
    };
  }

  if (!from && !to) {
    return {};
  }

  const createdAt = {};

  if (from) {
    createdAt[Op.gte] = from;
  }

  if (to) {
    createdAt[Op.lte] = to;
  }

  return { created_at: createdAt };
};

const getMetrics = async (req, res) => {
  try {
    const { from, to, annee } = req.query;
    const whereClause = buildDateFilter(from, to, annee);

    const [totalFactures, totalClients, totalArticles, totalHT, totalTVA, totalTTC, statusRows, recentFactures] = await Promise.all([
      Facture.count({ where: whereClause }),
      Client.count(),
      Article.count(),
      Facture.sum('total_ht', { where: whereClause }),
      Facture.sum('tva', { where: whereClause }),
      Facture.sum('total_ttc', { where: whereClause }),
      Facture.findAll({
        attributes: ['statut', [fn('COUNT', col('id')), 'count']],
        where: whereClause,
        group: ['statut']
      }),
      Facture.findAll({
        where: whereClause,
        include: [
          { model: Client },
          { model: User, as: 'user' },
          { model: LigneFacture, as: 'lignes_facture' }
        ],
        order: [['created_at', 'DESC']],
        limit: 5
      })
    ]);

    const statusBreakdown = {
      en_attente: 0,
      validee: 0,
      rejetee: 0,
      payee: 0
    };

    statusRows.forEach((row) => {
      statusBreakdown[row.statut] = Number(row.get('count'));
    });

    const revenueValidated = await Facture.sum('total_ttc', {
      where: {
        ...whereClause,
        statut: { [Op.in]: ['validee', 'payee'] }
      }
    });

    const revenueEncaisse = await Facture.sum('total_ttc', {
      where: {
        ...whereClause,
        statut: 'payee'
      }
    });

    const montantMoyen = totalFactures > 0 ? Number(totalTTC || 0) / totalFactures : 0;

    return res.status(200).json({
      filters: { from: from || null, to: to || null, annee: annee ? Number(annee) : null },
      totals: {
        factures: totalFactures,
        clients: totalClients,
        articles: totalArticles,
        total_ht: Number(totalHT || 0),
        total_tva: Number(totalTVA || 0),
        total_ttc: Number(totalTTC || 0),
        revenus_valides: Number(revenueValidated || 0),
        total_encaisse: Number(revenueEncaisse || 0),
        montant_moyen: Number(montantMoyen.toFixed(2)),
        factures_en_attente: statusBreakdown.en_attente,
        factures_rejetees: statusBreakdown.rejetee
      },
      status_breakdown: statusBreakdown,
      recent_factures: recentFactures
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors du chargement du tableau de bord.' });
  }
};

module.exports = {
  getMetrics
};
