import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { formatMoney as formatCurrency } from './formatMoney';

const DEFAULT_COMPANY = {
  name: 'TechPro Services',
  tagline: 'EMSI Casablanca — Facturation Platform',
  address: '123 Avenue des Technologies, Casablanca',
  email: 'contact@techpro-services.ma',
  phone: '+212 5 22 00 00 00',
  devise: 'MAD',
  logoBase64: ''
};

function formatPdfDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('fr-FR');
}

export const generatePdfBlob = async (facture, settings = {}) => {
  const company = { ...DEFAULT_COMPANY, ...settings };
  const devise = company.devise || 'MAD';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const qrPayload = JSON.stringify({
    numero: facture.numero,
    total_ttc: Number(facture.total_ttc || 0),
    verification: `${window.location.origin}/dashboard/factures`
  });

  const qrImage = await QRCode.toDataURL(qrPayload, { margin: 1, width: 120 });

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, 210, 28, 'F');

  let headerX = 15;

  if (company.logoBase64) {
    try {
      doc.addImage(company.logoBase64, 'PNG', 12, 5, 18, 18);
      headerX = 34;
    } catch (error) {
      console.warn('Could not add company logo', error);
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text(company.name, headerX, 12);
  doc.setFontSize(9);
  doc.text(company.tagline, headerX, 18);
  doc.text(`${company.email} · ${company.phone}`, headerX, 23);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(16);
  doc.text(`Facture ${facture.numero}`, 15, 40);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Date : ${formatPdfDate(facture.date_creation || facture.created_at)}`, 15, 47);
  doc.text(`Statut : ${facture.statut || '—'}`, 15, 53);

  const client = facture.Client || {};
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Client', 15, 63);
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text(client.nom || '—', 15, 69);
  if (client.email) doc.text(client.email, 15, 74);
  if (client.tel) doc.text(client.tel, 15, 79);
  if (client.adresse) doc.text(`${client.adresse}${client.ville ? `, ${client.ville}` : ''}`, 15, 84);

  const tableData = (facture.lignes_facture || []).map((line, index) => [
    index + 1,
    line.designation_snapshot || '—',
    line.quantite ?? 0,
    Number(line.prix_unitaire_applique || 0).toFixed(2),
    `${Number(line.remise_pct || 0)}%`,
    `${Number(line.tva_pct || 0)}%`,
    formatCurrency(line.total_ligne, devise)
  ]);

  autoTable(doc, {
    startY: 92,
    head: [['#', 'Désignation', 'Qté', 'PU', 'Remise', 'TVA', 'Total']],
    body: tableData.length ? tableData : [['—', 'Aucune ligne', '—', '—', '—', '—', '—']],
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 }
  });

  const finalY = doc.lastAutoTable?.finalY || 120;

  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Totaux', 130, finalY + 12);

  doc.setFontSize(10);
  doc.text(`Total HT : ${formatCurrency(facture.total_ht, devise)}`, 130, finalY + 19);
  doc.text(`TVA : ${formatCurrency(facture.tva, devise)}`, 130, finalY + 25);
  doc.setFont(undefined, 'bold');
  doc.text(`Total TTC : ${formatCurrency(facture.total_ttc, devise)}`, 130, finalY + 31);
  doc.setFont(undefined, 'normal');

  let currentY = finalY + 42;

  if (facture.signature_base64) {
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text('Signature numérique', 15, currentY);
    try {
      doc.addImage(facture.signature_base64, 'PNG', 15, currentY + 4, 55, 22);
    } catch (e) {
      console.warn('Could not add signature image', e);
    }
    currentY += 32;
  }

  doc.setFontSize(11);
  doc.text('QR Code de vérification', 15, currentY);
  doc.addImage(qrImage, 'PNG', 15, currentY + 4, 28, 28);

  return doc.output('blob');
};
