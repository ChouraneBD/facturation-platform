const WorkflowAlert = require('../models/WorkflowAlert');
const User = require('../models/User');

const ALERT_TYPES = {
    CREATED: 'facture_created',
    VALIDATED: 'facture_validated',
    REJECTED: 'facture_rejected',
    PAID: 'facture_paid'
};

async function createWorkflowAlert({ userId = null, type, message, factureNumero = null }) {
    return WorkflowAlert.create({
        user_id: userId,
        type,
        message,
        facture_numero: factureNumero,
        lu: false
    });
}

async function notifyAdmins(type, message, factureNumero) {
    const admins = await User.findAll({ where: { role: 'admin' } });
    const results = [];

    for (const admin of admins) {
        results.push(await createWorkflowAlert({
            userId: admin.id,
            type,
            message,
            factureNumero
        }));
    }

    if (admins.length === 0) {
        results.push(await createWorkflowAlert({ type, message, factureNumero }));
    }

    return results;
}

async function notifyUser(userId, type, message, factureNumero) {
    if (!userId) {
        return createWorkflowAlert({ type, message, factureNumero });
    }
    return createWorkflowAlert({ userId, type, message, factureNumero });
}

const listAlerts = async (req, res) => {
    try {
        const where = req.user.role === 'admin'
            ? {}
            : { user_id: req.user.id };

        const alerts = await WorkflowAlert.findAll({
            where,
            order: [['created_at', 'DESC']],
            limit: 50
        });

        return res.status(200).json(alerts);
    } catch (error) {
        console.error('List alerts error:', error);
        return res.status(500).json({ message: 'Erreur serveur lors de la récupération des alertes.' });
    }
};

const markAlertRead = async (req, res) => {
    try {
        const alert = await WorkflowAlert.findByPk(req.params.id);

        if (!alert) {
            return res.status(404).json({ message: 'Alerte introuvable.' });
        }

        if (req.user.role !== 'admin' && alert.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Accès interdit.' });
        }

        await alert.update({ lu: true });
        return res.status(200).json({ message: 'Alerte marquée comme lue.', alert });
    } catch (error) {
        console.error('Mark alert read error:', error);
        return res.status(500).json({ message: 'Erreur serveur.' });
    }
};

module.exports = {
    ALERT_TYPES,
    createWorkflowAlert,
    notifyAdmins,
    notifyUser,
    listAlerts,
    markAlertRead
};
