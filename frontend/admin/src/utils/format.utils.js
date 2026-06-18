export const formatCurrency = (amount, currency = 'GHS') => {
  const locales = { GHS: 'en-GH', USD: 'en-US', EUR: 'de-DE' };
  return new Intl.NumberFormat(locales[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(dateString));
};

export const formatMileage = (km) =>
  km != null ? `${new Intl.NumberFormat().format(km)} km` : '—';
