const mongoose = require('mongoose');

const ligneFactureSchema = new mongoose.Schema({
  article_id: { type: Number, default: null },
  designation_snapshot: { type: String, required: true },
  quantite: { type: Number, required: true },
  prix_unitaire_applique: { type: Number, required: true },
  remise_pct: { type: Number, default: 0 },
  tva_pct: { type: Number, default: 20 },
  total_ligne: { type: Number, required: true }
}, { _id: true });

const factureSchema = new mongoose.Schema({
  numero: { type: String, required: true, unique: true },
  date_creation: { type: Date, default: Date.now },
  statut: {
    type: String,
    enum: ['en_attente', 'validee', 'rejetee', 'payee'],
    default: 'en_attente'
  },
  methode_calcul: { type: Number, required: true, min: 1, max: 4 },
  remise_globale_pct: { type: Number, default: 0 },
  total_ht: { type: Number, required: true },
  tva: { type: Number, required: true, default: 0 },
  total_ttc: { type: Number, required: true },
  date_depot: { type: Date, default: null },
  date_encaissement: { type: Date, default: null },
  type_virement: { type: String, default: null },
  signature_base64: { type: String, default: null },
  pdf_url: { type: String, default: null },
  commentaire_admin: { type: String, default: null },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  validated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  validated_at: { type: Date, default: null },
  created_at: { type: Date, default: Date.now },
  lignes_facture: { type: [ligneFactureSchema], default: [] }
});

factureSchema.virtual('id').get(function getId() {
  return this._id.toString();
});

module.exports = mongoose.model('Facture', factureSchema);
