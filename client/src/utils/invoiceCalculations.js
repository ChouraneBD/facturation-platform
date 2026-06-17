const roundMoney = (value) => Number(Number(value || 0).toFixed(2));

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function calculateInvoiceTotals({ lines = [], methodeCalcul = 1, remiseGlobalePct = 0 } = {}) {
  const method = Number(methodeCalcul || 1);
  const globalDiscountPct = Math.max(0, toNumber(remiseGlobalePct, 0));

  const breakdown = lines.map((line, index) => {
    const quantity = Math.max(0, toNumber(line.quantite, 0));
    const unitPrice = Math.max(0, toNumber(line.prix_unitaire_applique, 0));
    const lineDiscountPct = Math.max(0, toNumber(line.remise_pct, 0));
    const tvaPct = Math.max(0, toNumber(line.tva_pct, 0));

    const baseHt = roundMoney(quantity * unitPrice);
    const lineDiscountAmount = roundMoney(baseHt * (lineDiscountPct / 100));
    const netHt = roundMoney(baseHt - lineDiscountAmount);

    return {
      index,
      article_id: line.article_id || '',
      designation_snapshot: line.designation_snapshot || '',
      quantite: quantity,
      prix_unitaire_applique: unitPrice,
      remise_pct: lineDiscountPct,
      tva_pct: tvaPct,
      base_ht: baseHt,
      remise_ligne: lineDiscountAmount,
      net_ht: netHt,
      tva: roundMoney(netHt * (tvaPct / 100)),
      total_ttc: roundMoney(netHt + roundMoney(netHt * (tvaPct / 100)))
    };
  });

  const totalBaseHt = breakdown.reduce((sum, line) => sum + line.base_ht, 0);
  const totalLineRemise = breakdown.reduce((sum, line) => sum + line.remise_ligne, 0);
  const totalNetHtBeforeGlobal = breakdown.reduce((sum, line) => sum + line.net_ht, 0);
  const totalNetTvaBeforeGlobal = breakdown.reduce((sum, line) => sum + line.tva, 0);

  const globalDiscountAmount = method >= 3 ? roundMoney(totalNetHtBeforeGlobal * (globalDiscountPct / 100)) : 0;
  const discountFactor = totalNetHtBeforeGlobal > 0 ? roundMoney((totalNetHtBeforeGlobal - globalDiscountAmount) / totalNetHtBeforeGlobal) : 0;

  const totalHt = method >= 3 ? roundMoney(totalNetHtBeforeGlobal - globalDiscountAmount) : roundMoney(totalNetHtBeforeGlobal);
  const totalTva = method >= 3
    ? roundMoney(breakdown.reduce((sum, line) => sum + roundMoney(line.net_ht * discountFactor * (line.tva_pct / 100)), 0))
    : roundMoney(totalNetTvaBeforeGlobal);
  const totalTtc = roundMoney(totalHt + totalTva);

  const adjustedBreakdown = breakdown.map((line) => {
    const adjustedBaseHt = method >= 3 ? roundMoney(line.net_ht * discountFactor) : line.net_ht;
    const adjustedTva = roundMoney(adjustedBaseHt * (line.tva_pct / 100));

    return {
      ...line,
      adjusted_ht: adjustedBaseHt,
      adjusted_tva: adjustedTva,
      adjusted_total_ttc: roundMoney(adjustedBaseHt + adjustedTva)
    };
  });

  return {
    method,
    total_base_ht: roundMoney(totalBaseHt),
    total_remise_ligne: roundMoney(totalLineRemise),
    remise_globale_pct: globalDiscountPct,
    remise_globale_montant: globalDiscountAmount,
    total_ht: totalHt,
    tva: totalTva,
    total_ttc: totalTtc,
    lignes: adjustedBreakdown
  };
}
