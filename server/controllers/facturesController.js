const sequelize = require('../config/database');
const Facture = require('../models/Facture');
const LigneFacture = require('../models/LigneFacture');
const Client = require('../models/Client');
const User = require('../models/User');
const Article = require('../models/Article');
const Category = require('../models/Category');
const {
  notifyInvoiceCreated,
  notifyInvoiceValidated,
  notifyInvoiceRejected,
  notifyInvoicePaid,
  summarizeEmailResults
} = require('../services/emailService');
const { ALERT_TYPES, notifyAdmins, notifyUser } = require('../services/alertService');
const { canAccessFacture, factureScopeWhere, canAccessClient, isAdmin } = require('../utils/accessScope');

const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const generateInvoiceNumber = async () => {
  let invoiceNumber;

  do {
    invoiceNumber = `FAC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (await Facture.findOne({ where: { numero: invoiceNumber } }));

  return invoiceNumber;
};

const prepareLine = async (line) => {
  const article = line.article_id
    ? await Article.findByPk(line.article_id, {
      include: [{ model: Category, attributes: ['id', 'nom', 'taux_tva'] }]
    })
    : null;

  const designationSnapshot = line.designation_snapshot || article?.designation;
  const quantite = Math.max(0, toNumber(line.quantite));
  const prixUnitaire = line.prix_unitaire_applique ?? article?.prix_unitaire;
  const remisePct = Math.max(0, toNumber(line.remise_pct ?? 0));
  const tvaPct = Math.max(0, toNumber(line.tva_pct ?? article?.Category?.taux_tva ?? 20));

  if (!designationSnapshot) {
    throw new Error('Chaque ligne doit avoir une designation_snapshot ou un article_id valide.');
  }

  if (!prixUnitaire || Number(prixUnitaire) <= 0) {
    throw new Error('Chaque ligne doit avoir un prix_unitaire_applique strictement positif.');
  }

  if (!quantite || quantite < 1) {
    throw new Error('Chaque ligne doit avoir une quantite supérieure à 0.');
  }

  const baseHt = roundMoney(quantite * Number(prixUnitaire));
  const discountAmount = roundMoney(baseHt * (remisePct / 100));
  const netHt = roundMoney(baseHt - discountAmount);
  const lineTva = roundMoney(netHt * (tvaPct / 100));

  return {
    article_id: article?.id || line.article_id || null,
    designation_snapshot: designationSnapshot,
    quantite,
    prix_unitaire_applique: roundMoney(prixUnitaire),
    remise_pct: remisePct,
    tva_pct: tvaPct,
    baseHt,
    netHt,
    lineTva,
    total_ligne: roundMoney(netHt + lineTva)
  };
};

const calculateTotals = (preparedLines, methodeCalcul, remiseGlobalePct) => {
  const method = Number(methodeCalcul || 1);
  const globalDiscountRate = Math.max(0, toNumber(remiseGlobalePct || 0)) / 100;
  const totalNetHtBeforeGlobal = preparedLines.reduce((sum, line) => sum + line.netHt, 0);
  const globalDiscountAmount = method >= 3 ? roundMoney(totalNetHtBeforeGlobal * globalDiscountRate) : 0;
  const discountFactor = totalNetHtBeforeGlobal > 0 ? (totalNetHtBeforeGlobal - globalDiscountAmount) / totalNetHtBeforeGlobal : 0;

  const adjustedLines = preparedLines.map((line) => {
    const adjustedHt = method >= 3 ? roundMoney(line.netHt * discountFactor) : line.netHt;
    const adjustedTva = roundMoney(adjustedHt * (line.tva_pct / 100));

    return {
      ...line,
      adjusted_ht: adjustedHt,
      adjusted_tva: adjustedTva,
      adjusted_total_ttc: roundMoney(adjustedHt + adjustedTva)
    };
  });

  const totalHt = adjustedLines.reduce((sum, line) => sum + line.adjusted_ht, 0);
  const totalTva = adjustedLines.reduce((sum, line) => sum + line.adjusted_tva, 0);

  return {
    total_ht: roundMoney(totalHt),
    tva: roundMoney(totalTva),
    total_ttc: roundMoney(totalHt + totalTva),
    lines: adjustedLines
  };
};

const buildFactureInclude = () => [
  { model: Client },
  { model: User, as: 'user' },
  { model: User, as: 'validatedBy' },
  { model: LigneFacture, as: 'lignes_facture' }
];

const filterFactures = (factures, query = {}) => {
  const search = String(query.search || '').trim().toLowerCase();
  const status = String(query.statut || '').trim().toLowerCase();
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  const annee = query.annee ? Number(query.annee) : null;

  return factures.filter((facture) => {
    if (status && facture.statut !== status) {
      return false;
    }

    const created = new Date(facture.date_creation || facture.created_at);

    if (annee && created.getFullYear() !== annee) {
      return false;
    }

    if (from && created < from) {
      return false;
    }

    if (to && created > to) {
      return false;
    }

    if (!search) {
      return true;
    }

    const clientName = facture.Client?.nom || '';
    const invoiceNumber = facture.numero || '';
    const comment = facture.commentaire_admin || '';

    return [clientName, invoiceNumber, comment].some((value) => String(value).toLowerCase().includes(search));
  });
};

const listFactures = async (req, res) => {
  try {
    const factures = await Facture.findAll({
      where: factureScopeWhere(req.user),
      include: buildFactureInclude(),
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json(filterFactures(factures, req.query));
  } catch (error) {
    console.error('List factures error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération des factures.' });
  }
};

const getFacture = async (req, res) => {
  try {
    const facture = await Facture.findByPk(req.params.id, {
      include: buildFactureInclude()
    });

    if (!facture) {
      return res.status(404).json({ message: 'Facture introuvable.' });
    }

    if (!canAccessFacture(req.user, facture)) {
      return res.status(403).json({ message: 'Accès interdit à cette facture.' });
    }

    return res.status(200).json(facture);
  } catch (error) {
    console.error('Get facture error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la récupération de la facture.' });
  }
};

const createFacture = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      client_id,
      methode_calcul,
      remise_globale_pct = 0,
      date_depot,
      date_encaissement,
      type_virement,
      signature_base64,
      pdf_url,
      commentaire_admin,
      lignes = []
    } = req.body;

    if (!client_id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'client_id est obligatoire.' });
    }

    const client = await Client.findByPk(client_id);
    if (!client) {
      await transaction.rollback();
      return res.status(400).json({ message: 'client_id invalide.' });
    }

    if (!canAccessClient(req.user, client)) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Accès interdit à ce client.' });
    }

    if (!Number.isInteger(Number(methode_calcul)) || Number(methode_calcul) < 1 || Number(methode_calcul) > 4) {
      await transaction.rollback();
      return res.status(400).json({ message: 'methode_calcul doit être comprise entre 1 et 4.' });
    }

    if (!Array.isArray(lignes) || lignes.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Au moins une ligne_facture est requise.' });
    }

    const preparedLines = [];
    for (const line of lignes) {
      preparedLines.push(await prepareLine(line));
    }

    const totals = calculateTotals(preparedLines, Number(methode_calcul), remise_globale_pct);
    const numero = await generateInvoiceNumber();

    const facture = await Facture.create({
      numero,
      methode_calcul,
      remise_globale_pct,
      total_ht: totals.total_ht,
      tva: totals.tva,
      total_ttc: totals.total_ttc,
      date_depot: date_depot || null,
      date_encaissement: date_encaissement || null,
      type_virement: type_virement || null,
      signature_base64: signature_base64 || null,
      pdf_url: pdf_url || null,
      commentaire_admin: commentaire_admin || null,
      client_id,
      user_id: req.user.id
    }, { transaction });

    const lineRows = totals.lines.map((line) => ({
      facture_id: facture.id,
      article_id: line.article_id,
      designation_snapshot: line.designation_snapshot,
      quantite: line.quantite,
      prix_unitaire_applique: line.prix_unitaire_applique,
      remise_pct: line.remise_pct,
      tva_pct: line.tva_pct,
      total_ligne: line.adjusted_total_ttc
    }));

    await LigneFacture.bulkCreate(lineRows, { transaction });
    await transaction.commit();

    const createdFacture = await Facture.findByPk(facture.id, { include: buildFactureInclude() });

    let emailSummary = { emailSent: false, sentCount: 0, skippedCount: 0, failedCount: 0 };
    try {
      const emailResults = await notifyInvoiceCreated(createdFacture);
      emailSummary = summarizeEmailResults(emailResults);
    } catch (emailError) {
      console.error('Create facture email error:', emailError);
      emailSummary.failedCount = 1;
    }

    const message = emailSummary.emailSent
      ? 'Facture créée avec succès. Notifications email envoyées.'
      : emailSummary.skippedCount > 0 && emailSummary.failedCount === 0
        ? 'Facture créée. Aucune notification envoyée (email client ou admin manquant).'
        : 'Facture créée, mais l\'envoi des notifications email a échoué.';

    try {
      await notifyAdmins(
        ALERT_TYPES.CREATED,
        `Nouvelle facture ${createdFacture.numero} en attente de validation.`,
        createdFacture.numero
      );
      await notifyUser(
        req.user.id,
        ALERT_TYPES.CREATED,
        `Votre facture ${createdFacture.numero} a été créée et est en attente.`,
        createdFacture.numero
      );
    } catch (alertError) {
      console.warn('Create facture alert error:', alertError.message);
    }

    return res.status(201).json({
      message,
      facture: createdFacture,
      ...emailSummary
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create facture error:', error);
    return res.status(500).json({ message: error.message || 'Erreur serveur lors de la création de la facture.' });
  }
};

const updateGlobalDiscount = async (req, res) => {
  try {
    const facture = await Facture.findByPk(req.params.id, {
      include: [{ model: LigneFacture, as: 'lignes_facture' }]
    });

    if (!facture) {
      return res.status(404).json({ message: 'Facture introuvable.' });
    }

    if (!canAccessFacture(req.user, facture)) {
      return res.status(403).json({ message: 'Accès interdit à cette facture.' });
    }

    const remiseGlobalePct = Number(req.body.remise_globale_pct);

    if (Number.isNaN(remiseGlobalePct) || remiseGlobalePct < 0 || remiseGlobalePct > 100) {
      return res.status(400).json({ message: 'remise_globale_pct doit être comprise entre 0 et 100.' });
    }

    const preparedLines = facture.lignes_facture.map((line) => ({
      baseHt: roundMoney(Number(line.quantite) * Number(line.prix_unitaire_applique)),
      netHt: roundMoney(Number(line.quantite) * Number(line.prix_unitaire_applique) * (1 - Number(line.remise_pct || 0) / 100)),
      tva_pct: Number(line.tva_pct),
      remise_pct: Number(line.remise_pct || 0),
      quantite: Number(line.quantite),
      prix_unitaire_applique: Number(line.prix_unitaire_applique)
    }));

    const totals = calculateTotals(preparedLines, Number(facture.methode_calcul), remiseGlobalePct);

    await facture.update({
      remise_globale_pct: remiseGlobalePct,
      total_ht: totals.total_ht,
      tva: totals.tva,
      total_ttc: totals.total_ttc
    });

    return res.status(200).json({
      message: 'Remise globale mise à jour avec succès.',
      facture: await Facture.findByPk(facture.id, { include: buildFactureInclude() })
    });
  } catch (error) {
    console.error('Update global discount error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour de la remise globale.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const facture = await Facture.findByPk(req.params.id);

    if (!facture) {
      return res.status(404).json({ message: 'Facture introuvable.' });
    }

    if (!canAccessFacture(req.user, facture)) {
      return res.status(403).json({ message: 'Accès interdit à cette facture.' });
    }

    const { statut, commentaire_admin, date_encaissement, type_virement } = req.body;

    if (!['en_attente', 'validee', 'rejetee', 'payee'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide.' });
    }

    if (!isAdmin(req.user)) {
      if (statut !== 'payee') {
        return res.status(403).json({ message: 'Seuls les administrateurs peuvent modifier ce statut.' });
      }
      if (facture.statut !== 'validee') {
        return res.status(400).json({ message: 'Seules les factures validées peuvent être marquées comme payées.' });
      }
    }

    const previousStatus = facture.statut;

    await facture.update({
      statut,
      commentaire_admin: commentaire_admin ?? facture.commentaire_admin,
      date_encaissement: date_encaissement ?? facture.date_encaissement,
      type_virement: type_virement ?? facture.type_virement,
      validated_by: facture.validated_by || req.user.id,
      validated_at: facture.validated_at || new Date()
    });

    const updatedFacture = await Facture.findByPk(facture.id, { include: buildFactureInclude() });

    if (statut === 'payee' && previousStatus !== 'payee') {
      try {
        await notifyUser(
          facture.user_id,
          ALERT_TYPES.PAID,
          `La facture ${updatedFacture.numero} a été marquée comme payée.`,
          updatedFacture.numero
        );
      } catch (alertError) {
        console.warn('Paid alert error:', alertError.message);
      }

      try {
        const emailResult = await notifyInvoicePaid(updatedFacture);
        const emailSummary = summarizeEmailResults(emailResult);
        return res.status(200).json({
          message: emailSummary.emailSent
            ? 'Statut mis à jour. Notification de paiement envoyée par email.'
            : 'Statut mis à jour, mais la notification email n\'a pas pu être envoyée.',
          facture: updatedFacture,
          ...emailSummary
        });
      } catch (emailError) {
        console.error('Paid notification email error:', emailError);
        return res.status(200).json({
          message: 'Statut mis à jour, mais la notification email a échoué.',
          facture: updatedFacture,
          emailSent: false
        });
      }
    }

    return res.status(200).json({
      message: 'Statut de facture mis à jour avec succès.',
      facture: updatedFacture
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la mise à jour du statut.' });
  }
};

const validateInvoice = async (req, res) => {
  try {
    const facture = await Facture.findByPk(req.params.id, { include: buildFactureInclude() });

    if (!facture) {
      return res.status(404).json({ message: 'Facture introuvable.' });
    }

    const { statut, pdfBase64, commentaire_admin } = req.body;
    if (!['validee', 'rejetee'].includes(statut)) {
      return res.status(400).json({ message: 'Statut de validation invalide.' });
    }

    await facture.update({
      statut,
      commentaire_admin: commentaire_admin ?? facture.commentaire_admin,
      validated_by: req.user.id,
      validated_at: new Date()
    });

    const updatedFacture = await Facture.findByPk(facture.id, { include: buildFactureInclude() });

    try {
      let emailResult;
      if (statut === 'validee') {
        emailResult = await notifyInvoiceValidated(updatedFacture, { pdfBase64, commentaire_admin });
        await notifyUser(
          updatedFacture.user_id,
          ALERT_TYPES.VALIDATED,
          `Votre facture ${updatedFacture.numero} a été validée.`,
          updatedFacture.numero
        );
      } else {
        emailResult = await notifyInvoiceRejected(updatedFacture, { commentaire_admin });
        await notifyUser(
          updatedFacture.user_id,
          ALERT_TYPES.REJECTED,
          `Votre facture ${updatedFacture.numero} a été rejetée.`,
          updatedFacture.numero
        );
      }

      const emailSummary = summarizeEmailResults(emailResult);

      return res.status(200).json({
        message: emailSummary.emailSent
          ? statut === 'validee'
            ? 'Facture validée. Notification et PDF envoyés par email au client.'
            : 'Facture rejetée. Notification envoyée par email au client.'
          : `Facture ${statut === 'validee' ? 'validée' : 'rejetée'}, mais la notification email n'a pas pu être envoyée.`,
        facture: updatedFacture,
        ...emailSummary
      });
    } catch (emailError) {
      console.error('Validation notification email error:', emailError);
      return res.status(200).json({
        message: `Facture ${statut === 'validee' ? 'validée' : 'rejetée'}, mais l'email de notification a échoué.`,
        facture: updatedFacture,
        emailSent: false
      });
    }
  } catch (error) {
    console.error('Validate invoice error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la validation de la facture.' });
  }
};

const sendInvoiceEmail = async (req, res) => {
  try {
    const facture = await Facture.findByPk(req.params.id, { include: buildFactureInclude() });

    if (!facture) {
      return res.status(404).json({ message: 'Facture introuvable.' });
    }

    if (!canAccessFacture(req.user, facture)) {
      return res.status(403).json({ message: 'Accès interdit à cette facture.' });
    }

    const { pdfBase64 } = req.body;
    if (!pdfBase64) {
      return res.status(400).json({ message: 'Le PDF est requis pour l\'envoi (format base64).' });
    }

    const mailResult = await notifyInvoiceValidated(facture, { pdfBase64 });
    const emailSummary = summarizeEmailResults(mailResult);

    return res.status(200).json({
      message: emailSummary.emailSent
        ? 'Facture envoyée par email avec succès.'
        : 'Échec de l\'envoi de la facture par email.',
      messageId: mailResult?.messageId || null,
      ...emailSummary
    });
  } catch (error) {
    console.error('Send invoice email error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de l’envoi de la facture par email.' });
  }
};

const verifyFacture = async (req, res) => {
  try {
    const facture = await Facture.findOne({
      where: { numero: req.params.numero },
      include: [{ model: Client, attributes: ['nom'] }]
    });

    if (!facture) {
      return res.status(404).json({ message: 'Facture introuvable.', verified: false });
    }

    return res.status(200).json({
      verified: true,
      numero: facture.numero,
      statut: facture.statut,
      total_ttc: Number(facture.total_ttc || 0),
      total_ht: Number(facture.total_ht || 0),
      tva: Number(facture.tva || 0),
      date_creation: facture.date_creation || facture.created_at,
      client_nom: facture.Client?.nom || null,
      has_signature: Boolean(facture.signature_base64)
    });
  } catch (error) {
    console.error('Verify facture error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de la vérification.' });
  }
};

module.exports = {
  listFactures,
  getFacture,
  createFacture,
  updateGlobalDiscount,
  updateStatus,
  validateInvoice,
  sendInvoiceEmail,
  verifyFacture
};
