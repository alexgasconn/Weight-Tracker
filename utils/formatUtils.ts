/**
 * Formats a number to Catalan locale with exactly 2 decimal places.
 * Example: 72.5 -> "72,50"
 */
export const formatNumber = (num: number): string => {
  if (isNaN(num) || num === undefined || num === null) return '-';
  return num.toLocaleString('ca-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
