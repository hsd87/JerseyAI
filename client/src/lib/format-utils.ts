/**
 * Utility functions for consistent data formatting throughout the application
 */

/**
 * Format a price value to a consistent currency string with exactly 2 decimal places
 * @param price The price to format (can be number or string)
 * @param currency The currency code (default: USD)
 * @param locale The locale to use for formatting (default: en-US)
 * @returns Formatted price string with currency symbol and exactly 2 decimal places
 */
export function formatPrice(
  price: number | string | undefined | null,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  // Handle empty values
  if (price === undefined || price === null) {
    return '$0.00';
  }

  // Convert string to number if needed
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;

  // Handle NaN
  if (isNaN(numericPrice)) {
    return '$0.00';
  }

  // Format with Intl.NumberFormat for consistency
  // Always use exactly 2 decimal places for all prices
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericPrice);
}

/**
 * Format a date to a readable string
 * @param date The date to format (can be string, Date object, or timestamp)
 * @param format The format to use (default: standard date)
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | number | undefined | null,
  format: 'standard' | 'short' | 'long' = 'standard'
): string {
  // Handle empty values
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;

  // Handle invalid dates
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }

  // Format based on requested format
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'standard':
    default:
      return dateObj.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
  }
}