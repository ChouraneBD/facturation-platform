const nodemailer = require('nodemailer');
const User = require('../models/User');

const money = (value) => Number(value || 0).toFixed(2);

let transporterPromise = null;

function normalizeSmtpPassword(value) {
    return String(value || '').replace(/\s/g, '');
}

function resolveFromAddress() {
    const smtpUser = process.env.SMTP_USER;
    if (smtpUser) {
        const displayName = process.env.SMTP_FROM_NAME || 'TechPro Services';
        return `"${displayName}" <${smtpUser}>`;
    }

    return process.env.SMTP_FROM || 'no-reply@techpro-services.ma';
}

async function createTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: String(process.env.SMTP_SECURE || 'false') === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: normalizeSmtpPassword(process.env.SMTP_PASS)
            }
        });

        try {
            await transporter.verify();
            console.log(`[email] SMTP prêt — ${process.env.SMTP_HOST} (${process.env.SMTP_USER})`);
        } catch (error) {
            console.warn(`[email] Vérification SMTP échouée (${error.message}) — tentative d'envoi quand même.`);
        }

        return transporter;
    }

    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    });

    console.warn('[email] SMTP non configuré — utilisation du compte de test Ethereal.');
    console.warn(`[email] Compte Ethereal : ${testAccount.user}`);
    return transporter;
}

async function getTransporter() {
    if (!transporterPromise) {
        transporterPromise = createTransporter().catch((error) => {
            transporterPromise = null;
            throw error;
        });
    }

    return transporterPromise;
}

async function resolveAdminEmail() {
    const admin = await User.findOne({ where: { role: 'admin' }, order: [['id', 'ASC']] });
    if (admin?.email) {
        return admin.email;
    }

    if (process.env.ADMIN_EMAIL) {
        return process.env.ADMIN_EMAIL;
    }

    return process.env.SMTP_USER || null;
}

async function resolveClientEmail(facture) {
    if (facture?.Client?.email) {
        return facture.Client.email;
    }

    if (facture?.user?.email) {
        return facture.user.email;
    }

    if (facture?.user_id) {
        const user = await User.findByPk(facture.user_id);
        return user?.email || null;
    }

    return null;
}

function buildHtmlLayout({ title, body, accent = '#4f46e5' }) {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="background:${accent};padding:24px 32px;">
          <div style="color:#fff;font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9;">TechPro Services</div>
          <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:700;">${title}</h1>
        </td></tr>
        <tr><td style="padding:32px;">${body}</td></tr>
        <tr><td style="padding:20px 32px;background:#f1f5f9;font-size:12px;color:#64748b;">
          Facturation Platform — EMSI Casablanca PFA<br>
          Cet email est une notification automatique.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendMail({ to, subject, html, text, attachments = [] }) {
    if (!to) {
        console.warn('[email] Aucun destinataire — notification ignorée.');
        return { sent: false, skipped: true, reason: 'missing_recipient' };
    }

    try {
        const transporter = await getTransporter();
        const result = await transporter.sendMail({
            from: resolveFromAddress(),
            to,
            subject,
            text,
            html,
            attachments
        });

        const previewUrl = nodemailer.getTestMessageUrl(result);
        if (previewUrl) {
            console.log(`[email] Envoyé → ${to} | ${subject}`);
            console.log(`[email] Aperçu Ethereal : ${previewUrl}`);
        } else {
            console.log(`[email] Envoyé → ${to} | ${subject} | ${result.messageId || 'ok'}`);
        }

        return {
            sent: true,
            skipped: false,
            messageId: result.messageId || null,
            previewUrl: previewUrl || null
        };
    } catch (error) {
        console.error(`[email] Échec envoi → ${to} | ${subject}:`, error.message);
        return {
            sent: false,
            skipped: false,
            error: error.message
        };
    }
}

async function notifyInvoiceCreated(facture) {
    const client = facture.Client;
    const clientName = client?.nom || 'Client';
    const clientEmail = await resolveClientEmail(facture);
    const results = [];

    const clientHtml = buildHtmlLayout({
        title: 'Facture créée',
        body: `
          <p>Bonjour <strong>${clientName}</strong>,</p>
          <p>Votre facture <strong>${facture.numero}</strong> a été enregistrée et est en attente de validation par notre équipe.</p>
          <table style="width:100%;margin:20px 0;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748b;">Montant TTC</td><td style="padding:8px 0;text-align:right;font-weight:700;">${money(facture.total_ttc)} EUR</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Statut</td><td style="padding:8px 0;text-align:right;">En attente</td></tr>
          </table>
          <p style="color:#64748b;font-size:14px;">Vous recevrez un email de confirmation dès que la facture sera validée.</p>`
    });

    results.push(await sendMail({
        to: clientEmail,
        subject: `[TechPro] Facture ${facture.numero} — en attente de validation`,
        text: `Bonjour ${clientName}, votre facture ${facture.numero} (${money(facture.total_ttc)} EUR TTC) est en attente de validation.`,
        html: clientHtml
    }));

    const adminEmail = await resolveAdminEmail();
    if (adminEmail) {
        const adminHtml = buildHtmlLayout({
            title: 'Nouvelle facture à valider',
            accent: '#0891b2',
            body: `
              <p>Une nouvelle facture nécessite votre attention.</p>
              <table style="width:100%;margin:20px 0;border-collapse:collapse;">
                <tr><td style="padding:8px 0;color:#64748b;">Numéro</td><td style="padding:8px 0;text-align:right;font-weight:700;">${facture.numero}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Client</td><td style="padding:8px 0;text-align:right;">${clientName}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b;">Montant TTC</td><td style="padding:8px 0;text-align:right;font-weight:700;">${money(facture.total_ttc)} EUR</td></tr>
              </table>
              <p>Connectez-vous au tableau de bord pour valider ou rejeter cette facture.</p>`
        });

        results.push(await sendMail({
            to: adminEmail,
            subject: `[Admin] Nouvelle facture ${facture.numero} à valider`,
            text: `Nouvelle facture ${facture.numero} pour ${clientName} — ${money(facture.total_ttc)} EUR TTC.`,
            html: adminHtml
        }));
    }

    return results;
}

async function notifyInvoiceValidated(facture, { pdfBase64, commentaire_admin } = {}) {
    const client = facture.Client;
    const clientName = client?.nom || 'Client';
    const clientEmail = await resolveClientEmail(facture);
    const attachments = [];

    if (pdfBase64) {
        const pdfBuffer = Buffer.from(String(pdfBase64).split(',')[1] || pdfBase64, 'base64');
        attachments.push({
            filename: `${facture.numero}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        });
    }

    const html = buildHtmlLayout({
        title: 'Facture validée',
        accent: '#059669',
        body: `
          <p>Bonjour <strong>${clientName}</strong>,</p>
          <p>Bonne nouvelle ! Votre facture <strong>${facture.numero}</strong> a été <strong style="color:#059669;">validée</strong>.</p>
          <table style="width:100%;margin:20px 0;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748b;">Montant TTC</td><td style="padding:8px 0;text-align:right;font-weight:700;">${money(facture.total_ttc)} EUR</td></tr>
          </table>
          ${attachments.length ? '<p>La facture PDF est jointe à cet email.</p>' : '<p>Vous pouvez télécharger votre facture depuis votre espace client.</p>'}
          ${commentaire_admin ? `<p style="background:#f0fdf4;padding:12px;border-radius:8px;font-size:14px;"><strong>Note :</strong> ${commentaire_admin}</p>` : ''}`
    });

    return sendMail({
        to: clientEmail,
        subject: `[TechPro] Facture ${facture.numero} validée`,
        text: `Bonjour ${clientName}, votre facture ${facture.numero} a été validée. Montant TTC : ${money(facture.total_ttc)} EUR.`,
        html,
        attachments
    });
}

async function notifyInvoiceRejected(facture, { commentaire_admin } = {}) {
    const client = facture.Client;
    const clientName = client?.nom || 'Client';
    const clientEmail = await resolveClientEmail(facture);

    const html = buildHtmlLayout({
        title: 'Facture rejetée',
        accent: '#dc2626',
        body: `
          <p>Bonjour <strong>${clientName}</strong>,</p>
          <p>Votre facture <strong>${facture.numero}</strong> a été <strong style="color:#dc2626;">rejetée</strong> par notre équipe comptable.</p>
          ${commentaire_admin ? `<p style="background:#fef2f2;padding:12px;border-radius:8px;font-size:14px;"><strong>Motif :</strong> ${commentaire_admin}</p>` : '<p style="color:#64748b;">Contactez-nous pour plus de détails.</p>'}
          <p style="color:#64748b;font-size:14px;">Une nouvelle facture peut être soumise après correction.</p>`
    });

    return sendMail({
        to: clientEmail,
        subject: `[TechPro] Facture ${facture.numero} rejetée`,
        text: `Bonjour ${clientName}, votre facture ${facture.numero} a été rejetée.${commentaire_admin ? ` Motif : ${commentaire_admin}` : ''}`,
        html
    });
}

async function notifyInvoicePaid(facture) {
    const client = facture.Client;
    const clientName = client?.nom || 'Client';
    const clientEmail = await resolveClientEmail(facture);

    const html = buildHtmlLayout({
        title: 'Paiement enregistré',
        accent: '#7c3aed',
        body: `
          <p>Bonjour <strong>${clientName}</strong>,</p>
          <p>Le paiement de votre facture <strong>${facture.numero}</strong> a été enregistré.</p>
          <table style="width:100%;margin:20px 0;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748b;">Montant TTC</td><td style="padding:8px 0;text-align:right;font-weight:700;">${money(facture.total_ttc)} EUR</td></tr>
            ${facture.date_encaissement ? `<tr><td style="padding:8px 0;color:#64748b;">Date encaissement</td><td style="padding:8px 0;text-align:right;">${facture.date_encaissement}</td></tr>` : ''}
            ${facture.type_virement ? `<tr><td style="padding:8px 0;color:#64748b;">Mode</td><td style="padding:8px 0;text-align:right;">${facture.type_virement}</td></tr>` : ''}
          </table>
          <p style="color:#64748b;font-size:14px;">Merci pour votre confiance.</p>`
    });

    return sendMail({
        to: clientEmail,
        subject: `[TechPro] Paiement reçu — Facture ${facture.numero}`,
        text: `Bonjour ${clientName}, le paiement de la facture ${facture.numero} (${money(facture.total_ttc)} EUR) a été enregistré.`,
        html
    });
}

function summarizeEmailResults(results) {
    const list = Array.isArray(results) ? results : [results];
    const sentCount = list.filter((item) => item?.sent).length;
    const skippedCount = list.filter((item) => item?.skipped).length;
    const failedCount = list.filter((item) => !item?.sent && !item?.skipped).length;

    return {
        sentCount,
        skippedCount,
        failedCount,
        emailSent: sentCount > 0 && failedCount === 0,
        details: list
    };
}

module.exports = {
    sendMail,
    notifyInvoiceCreated,
    notifyInvoiceValidated,
    notifyInvoiceRejected,
    notifyInvoicePaid,
    summarizeEmailResults,
    warmUpEmailTransport: getTransporter
};
