import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_TYPES,
  isSingleUserNotification,
  getNotificationType,
  extractIconColor
} from '../src/lib/notificationDetector.js';

describe('notificationDetector', () => {
  describe('NOTIFICATION_TYPES', () => {
    it('should have correct notification type definitions', () => {
      expect(NOTIFICATION_TYPES.REPLY.color).toBe('#24c3ff');
      expect(NOTIFICATION_TYPES.REPLY.isSingleUser).toBe(true);

      expect(NOTIFICATION_TYPES.MENTION.color).toBe('#20c584');
      expect(NOTIFICATION_TYPES.MENTION.isSingleUser).toBe(true);

      expect(NOTIFICATION_TYPES.QUOTE.color).toBe('#fe7900');
      expect(NOTIFICATION_TYPES.QUOTE.isSingleUser).toBe(true);
    });
  });

  describe('isSingleUserNotification', () => {
    it('should return true for reply icon color', () => {
      expect(isSingleUserNotification('#24c3ff')).toBe(true);
      expect(isSingleUserNotification('#24C3FF')).toBe(true); // Case insensitive
      expect(isSingleUserNotification('  #24c3ff  ')).toBe(true); // Whitespace tolerant
    });

    it('should return true for mention icon color', () => {
      expect(isSingleUserNotification('#20c584')).toBe(true);
      expect(isSingleUserNotification('#20C584')).toBe(true);
    });

    it('should return true for quote icon color', () => {
      expect(isSingleUserNotification('#fe7900')).toBe(true);
      expect(isSingleUserNotification('#FE7900')).toBe(true);
    });

    it('should return false for unknown colors (aggregated notifications)', () => {
      expect(isSingleUserNotification('#ff0000')).toBe(false); // Unknown red
      expect(isSingleUserNotification('#e91e63')).toBe(false); // Pink (likes)
      expect(isSingleUserNotification('#9c27b0')).toBe(false); // Purple (follows)
    });

    it('should return false for null or undefined', () => {
      expect(isSingleUserNotification(null)).toBe(false);
      expect(isSingleUserNotification(undefined)).toBe(false);
      expect(isSingleUserNotification('')).toBe(false);
    });
  });

  describe('getNotificationType', () => {
    it('should identify reply notifications', () => {
      const type = getNotificationType('#24c3ff');
      expect(type).not.toBeNull();
      expect(type.name).toBe('Reply');
      expect(type.color).toBe('#24c3ff');
      expect(type.isSingleUser).toBe(true);
    });

    it('should identify mention notifications', () => {
      const type = getNotificationType('#20C584');
      expect(type).not.toBeNull();
      expect(type.name).toBe('Mention');
      expect(type.isSingleUser).toBe(true);
    });

    it('should identify quote notifications', () => {
      const type = getNotificationType('#FE7900');
      expect(type).not.toBeNull();
      expect(type.name).toBe('Quote');
      expect(type.isSingleUser).toBe(true);
    });

    it('should return null for unknown colors', () => {
      expect(getNotificationType('#unknown')).toBeNull();
      expect(getNotificationType('#ff0000')).toBeNull();
    });

    it('should return null for null or undefined', () => {
      expect(getNotificationType(null)).toBeNull();
      expect(getNotificationType(undefined)).toBeNull();
      expect(getNotificationType('')).toBeNull();
    });

    it('should be case insensitive', () => {
      const lowerCase = getNotificationType('#24c3ff');
      const upperCase = getNotificationType('#24C3FF');
      const mixedCase = getNotificationType('#24c3FF');

      expect(lowerCase).toEqual(upperCase);
      expect(lowerCase).toEqual(mixedCase);
    });
  });

  describe('extractIconColor', () => {
    it('should extract color from inline style', () => {
      const mockElement = {
        getAttribute: (attr) => {
          if (attr === 'style') return '--x-backgroundColor: #24c3ff';
          return null;
        },
        style: {
          getPropertyValue: () => null
        }
      };

      const color = extractIconColor(mockElement);
      expect(color).toBe('#24c3ff');
    });

    it('should extract color from style.getPropertyValue', () => {
      const mockElement = {
        getAttribute: () => null,
        style: {
          getPropertyValue: (prop) => {
            if (prop === '--x-backgroundColor') return '#20c584';
            return null;
          }
        }
      };

      const color = extractIconColor(mockElement);
      expect(color).toBe('#20c584');
    });

    it('should return null for element without color', () => {
      const mockElement = {
        getAttribute: () => null,
        style: {
          getPropertyValue: () => null
        }
      };

      const color = extractIconColor(mockElement);
      expect(color).toBeNull();
    });

    it('should return null for null element', () => {
      expect(extractIconColor(null)).toBeNull();
      expect(extractIconColor(undefined)).toBeNull();
    });

    it('should handle complex style strings', () => {
      const mockElement = {
        getAttribute: (attr) => {
          if (attr === 'style') {
            return 'display: flex; --x-backgroundColor: #fe7900; margin: 10px';
          }
          return null;
        },
        style: {
          getPropertyValue: () => null
        }
      };

      const color = extractIconColor(mockElement);
      expect(color).toBe('#fe7900');
    });
  });
});
