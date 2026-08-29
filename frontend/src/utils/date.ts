/**
 * Formats a timestamp or Date object into a unified string: YYYY-MM-DD HH:mm
 * @param val - The date value to format
 * @returns The formatted date string
 */
export const formatDate = (val?: number | string | Date | null): string => {
  if (!val) return '';
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('sv').slice(0, 16);
};
