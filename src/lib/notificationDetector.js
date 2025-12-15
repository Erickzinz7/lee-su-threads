/**
 * Notification type detection constants and utilities
 * Pure functions that can be easily tested
 */

export const NOTIFICATION_TYPES = {
  REPLY: { color: '#24c3ff', name: 'Reply', isSingleUser: true },
  MENTION: { color: '#20c584', name: 'Mention', isSingleUser: true },
  QUOTE: { color: '#fe7900', name: 'Quote', isSingleUser: true },
  // Aggregated notifications (can have multiple users)
  LIKE: { color: null, name: 'Like', isSingleUser: false },
  FOLLOW: { color: null, name: 'Follow', isSingleUser: false }
};

/**
 * Determine if a notification icon color represents a single-user notification
 * @param {string} iconColor - The background color from the icon element
 * @returns {boolean} - True if single-user notification (reply, mention, quote)
 */
export function isSingleUserNotification(iconColor) {
  if (!iconColor) return false;

  const normalizedColor = iconColor.toLowerCase().trim();
  const allowedColors = Object.values(NOTIFICATION_TYPES)
    .filter(type => type.isSingleUser)
    .map(type => type.color);

  return allowedColors.includes(normalizedColor);
}

/**
 * Get notification type from icon color
 * @param {string} iconColor - The background color from the icon element
 * @returns {object|null} - Notification type object or null if unknown
 */
export function getNotificationType(iconColor) {
  if (!iconColor) return null;

  const normalizedColor = iconColor.toLowerCase().trim();
  return Object.values(NOTIFICATION_TYPES)
    .find(type => type.color === normalizedColor) || null;
}

/**
 * Extract icon background color from element
 * @param {HTMLElement} element - DOM element with style attribute
 * @returns {string|null} - Background color or null
 */
export function extractIconColor(element) {
  if (!element) return null;

  const bgColor = element.style?.getPropertyValue('--x-backgroundColor') ||
                 element.getAttribute('style')?.match(/--x-backgroundColor:\s*([^;)]+)/)?.[1]?.trim();

  return bgColor || null;
}

/**
 * Find icon element in container or parent containers
 * @param {HTMLElement} container - Starting container element
 * @param {number} maxLevels - Maximum number of parent levels to search (default: 5)
 * @returns {HTMLElement|null} - Icon element or null
 */
export function findIconElement(container, maxLevels = 5) {
  if (!container) return null;

  let searchScope = container;

  for (let i = 0; i < maxLevels && searchScope; i++) {
    const iconElement = searchScope.querySelector('[style*="--x-backgroundColor"]');
    if (iconElement) return iconElement;
    searchScope = searchScope.parentElement;
  }

  return null;
}
