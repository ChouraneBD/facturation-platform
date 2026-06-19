function formatUser(user) {
  if (!user) {
    return null;
  }

  const plain = user.toJSON ? user.toJSON() : user;
  return {
    id: plain.id || String(plain._id),
    nom: plain.nom,
    email: plain.email,
    role: plain.role
  };
}

function formatClient(client) {
  if (!client) {
    return null;
  }

  const plain = client.toJSON ? client.toJSON() : client;
  return {
    id: plain.id || String(plain._id),
    nom: plain.nom,
    email: plain.email,
    tel: plain.tel,
    adresse: plain.adresse,
    ville: plain.ville,
    created_at: plain.created_at
  };
}

function formatFacture(doc) {
  if (!doc) {
    return null;
  }

  const facture = doc.toObject({ virtuals: true });
  const client = facture.client_id && typeof facture.client_id === 'object'
    ? formatClient(facture.client_id)
    : null;
  const user = facture.user_id && typeof facture.user_id === 'object'
    ? formatUser(facture.user_id)
    : null;
  const validatedBy = facture.validated_by && typeof facture.validated_by === 'object'
    ? formatUser(facture.validated_by)
    : null;

  return {
    id: facture._id.toString(),
    numero: facture.numero,
    date_creation: facture.date_creation,
    statut: facture.statut,
    methode_calcul: facture.methode_calcul,
    remise_globale_pct: facture.remise_globale_pct,
    total_ht: facture.total_ht,
    tva: facture.tva,
    total_ttc: facture.total_ttc,
    date_depot: facture.date_depot,
    date_encaissement: facture.date_encaissement,
    type_virement: facture.type_virement,
    signature_base64: facture.signature_base64,
    pdf_url: facture.pdf_url,
    commentaire_admin: facture.commentaire_admin,
    client_id: client?.id || String(facture.client_id),
    user_id: user?.id || String(facture.user_id),
    validated_by: validatedBy?.id || (facture.validated_by ? String(facture.validated_by) : null),
    validated_at: facture.validated_at,
    created_at: facture.created_at,
    Client: client,
    user,
    validatedBy,
    lignes_facture: (facture.lignes_facture || []).map((line) => ({
      id: line._id ? line._id.toString() : undefined,
      article_id: line.article_id,
      designation_snapshot: line.designation_snapshot,
      quantite: line.quantite,
      prix_unitaire_applique: line.prix_unitaire_applique,
      remise_pct: line.remise_pct,
      tva_pct: line.tva_pct,
      total_ligne: line.total_ligne
    }))
  };
}

const facturePopulate = [
  { path: 'client_id' },
  { path: 'user_id', select: '-mot_de_passe' },
  { path: 'validated_by', select: '-mot_de_passe' }
];

module.exports = {
  formatFacture,
  facturePopulate
};
