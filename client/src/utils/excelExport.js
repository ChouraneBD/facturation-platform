import * as XLSX from 'xlsx';
import { formatMoney, getCurrencyCode } from './formatMoney';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR');
}

export function exportFacturesToExcel(factures, { devise = 'EUR', year = null } = {}) {
  const currency = getCurrencyCode(devise);
  const rows = factures.map((facture) => ({
    Numero: facture.numero,
    Client: facture.Client?.nom || '',
    'Date creation': formatDate(facture.date_creation || facture.created_at),
    Statut: facture.statut,
    'Total HT': Number(facture.total_ht || 0),
    TVA: Number(facture.tva || 0),
    'Total TTC': Number(facture.total_ttc || 0),
    Devise: currency,
    'Date depot': formatDate(facture.date_depot),
    'Date encaissement': formatDate(facture.date_encaissement),
    'Type virement': facture.type_virement || '',
    'Remise globale %': Number(facture.remise_globale_pct || 0)
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Factures');

  const suffix = year ? `_${year}` : '';
  XLSX.writeFile(workbook, `factures${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportFacturesSummary(factures, devise = 'EUR') {
  const totalTtc = factures.reduce((sum, f) => sum + Number(f.total_ttc || 0), 0);
  return {
    count: factures.length,
    totalTtc,
    label: formatMoney(totalTtc, devise)
  };
}
