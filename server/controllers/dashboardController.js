const Facture = require('../models/Facture');
const Client = require('../models/Client');
const { countArticles } = require('../services/jsonServerClient');
const { formatFacture, facturePopulate } = require('../utils/factureFormatter');

const buildDateFilter = (from, to, annee) => {
  if (annee) {
    const year = Number(annee);
    return {
      created_at: {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`)
      }
    };
  }

  if (!from && !to) {
    return {};
  }

  const createdAt = {};

  if (from) {
    createdAt.$gte = new Date(from);
  }

  if (to) {
    createdAt.$lte = new Date(to);
  }

  return { created_at: createdAt };
};

const getMetrics = async (req, res) => {
  try {
    const { from, to, annee } = req.query;
    const whereClause = buildDateFilter(from, to, annee);

    const [
      totalFactures,
      totalClients,
      totalArticles,
      aggregateTotals,
      statusRows,
      recentFactures
    ] = await Promise.all([
      Facture.countDocuments(whereClause),
      Client.countDocuments(),
      countArticles(),
      Facture.aggregate([
        { $match: whereClause },
        {
          $group: {
            _id: null,
            total_ht: { $sum: '$total_ht' },
            total_tva: { $sum: '$tva' },
            total_ttc: { $sum: '$total_ttc' }
          }
        }
      ]),
      Facture.aggregate([
        { $match: whereClause },
        { $group: { _id: '$statut', count: { $sum: 1 } } }
      ]),
      Facture.find(whereClause)
        .populate(facturePopulate)
        .sort({ created_at: -1 })
        .limit(5)
    ]);

    const totals = aggregateTotals[0] || { total_ht: 0, total_tva: 0, total_ttc: 0 };

    const statusBreakdown = {
      en_attente: 0,
      validee: 0,
      rejetee: 0,
      payee: 0
    };

    statusRows.forEach((row) => {
      statusBreakdown[row._id] = row.count;
    });

    const revenueValidated = await Facture.aggregate([
      {
        $match: {
          ...whereClause,
          statut: { $in: ['validee', 'payee'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$total_ttc' } } }
    ]);

    const revenueEncaisse = await Facture.aggregate([
      {
        $match: {
          ...whereClause,
          statut: 'payee'
        }
      },
      { $group: { _id: null, total: { $sum: '$total_ttc' } } }
    ]);

    const totalTTC = Number(totals.total_ttc || 0);
    const montantMoyen = totalFactures > 0 ? totalTTC / totalFactures : 0;

    return res.status(200).json({
      filters: { from: from || null, to: to || null, annee: annee ? Number(annee) : null },
      totals: {
        factures: totalFactures,
        clients: totalClients,
        articles: totalArticles,
        total_ht: Number(totals.total_ht || 0),
        total_tva: Number(totals.total_tva || 0),
        total_ttc: totalTTC,
        revenus_valides: Number(revenueValidated[0]?.total || 0),
        total_encaisse: Number(revenueEncaisse[0]?.total || 0),
        montant_moyen: Number(montantMoyen.toFixed(2)),
        factures_en_attente: statusBreakdown.en_attente,
        factures_rejetees: statusBreakdown.rejetee
      },
      status_breakdown: statusBreakdown,
      recent_factures: recentFactures.map((facture) => formatFacture(facture))
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors du chargement du tableau de bord.' });
  }
};

module.exports = {
  getMetrics
};
