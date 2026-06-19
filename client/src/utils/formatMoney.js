const CURRENCY_MAP = {
  EUR: { locale: 'fr-FR', currency: 'EUR' },
  MAD: { locale: 'fr-MA', currency: 'MAD' },
  USD: { locale: 'en-US', currency: 'USD' }
};

export function getCurrencyCode(devise = 'EUR') {
  const code = String(devise || 'EUR').toUpperCase();
  return CURRENCY_MAP[code] ? code : 'EUR';
}

export function createMoneyFormatter(devise = 'EUR') {
  const code = getCurrencyCode(devise);
  const { locale, currency } = CURRENCY_MAP[code];
  return new Intl.NumberFormat(locale, { style: 'currency', currency });
}

export function formatMoney(value, devise = 'EUR') {
  return createMoneyFormatter(devise).format(Number(value || 0));
}
