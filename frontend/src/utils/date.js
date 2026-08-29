/**
 * Formats a timestamp or Date object into a unified string: YYYY-MM-DD HH:mm
 * @param {number|string|Date} val - The date value to format
 * @returns {string} The formatted date string
 */
export const formatDate = (val) => {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('sv').slice(0, 16);
};

