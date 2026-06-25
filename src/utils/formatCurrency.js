/**
 * Formats a numeric value into a currency string (default INR).
 * @param {number} amount - Value to format
 * @param {string} locale - Locale code (default en-IN)
 * @param {string} currency - Currency code (default INR)
 * @returns {string}
 */
export function formatCurrency(amount, locale = 'en-IN', currency = 'INR') {
  const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
  
  if (isNaN(parsedAmount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(0);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2
  }).format(parsedAmount);
}
