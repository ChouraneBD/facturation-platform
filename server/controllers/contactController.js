const User = require('../models/User');
const { sendMail } = require('../services/emailService');

const sendContactMessage = async (req, res) => {
  try {
    const { nom, email, sujet, message } = req.body;

    if (!nom || !email || !sujet || !message) {
      return res.status(400).json({ message: 'nom, email, sujet et message sont obligatoires.' });
    }

    const admin = await User.findOne({ role: 'admin' }).sort({ created_at: 1 });
    const recipient = admin?.email || process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (!recipient) {
      return res.status(503).json({ message: 'Aucun destinataire admin configuré pour les messages de contact.' });
    }

    const result = await sendMail({
      to: recipient,
      subject: `[Contact] ${sujet}`,
      text: `De: ${nom} <${email}>\n\n${message}`,
      html: `<p><strong>De:</strong> ${nom} &lt;${email}&gt;</p><p><strong>Objet:</strong> ${sujet}</p><p>${message.replace(/\n/g, '<br>')}</p>`
    });

    if (!result.sent) {
      return res.status(502).json({ message: result.error || 'Échec envoi du message de contact.' });
    }

    return res.status(200).json({ message: 'Votre message a bien été envoyé. Nous vous répondrons sous 24h.' });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ message: 'Erreur serveur lors de l\'envoi du message.' });
  }
};

module.exports = { sendContactMessage };
