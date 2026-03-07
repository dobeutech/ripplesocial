import { describe, it, expect } from 'vitest';
import {
  POLLING_INTERVALS,
  FEED_LIMITS,
  SEARCH_CONFIG,
  POST_LIMITS,
  AUTH_LIMITS,
} from '../config/constants';

describe('Application Constants', () => {
  describe('POLLING_INTERVALS', () => {
    it('has a notification polling interval of 30 seconds', () => {
      expect(POLLING_INTERVALS.NOTIFICATIONS).toBe(30000);
    });
  });

  describe('FEED_LIMITS', () => {
    it('has a default feed limit', () => {
      expect(FEED_LIMITS.DEFAULT).toBe(50);
    });

    it('has a top stories limit', () => {
      expect(FEED_LIMITS.TOP_STORIES).toBe(20);
    });

    it('top stories limit is less than default', () => {
      expect(FEED_LIMITS.TOP_STORIES).toBeLessThan(FEED_LIMITS.DEFAULT);
    });
  });

  describe('SEARCH_CONFIG', () => {
    it('requires at least 2 characters to search', () => {
      expect(SEARCH_CONFIG.MIN_CHARACTERS).toBe(2);
    });

    it('limits search results to 5', () => {
      expect(SEARCH_CONFIG.MAX_RESULTS).toBe(5);
    });
  });

  describe('POST_LIMITS', () => {
    it('has a maximum content length', () => {
      expect(POST_LIMITS.MAX_CONTENT_LENGTH).toBeGreaterThan(0);
      expect(POST_LIMITS.MAX_CONTENT_LENGTH).toBe(2000);
    });

    it('has a maximum recipient name length', () => {
      expect(POST_LIMITS.MAX_RECIPIENT_NAME_LENGTH).toBeGreaterThan(0);
      expect(POST_LIMITS.MAX_RECIPIENT_NAME_LENGTH).toBe(100);
    });
  });

  describe('AUTH_LIMITS', () => {
    it('requires minimum 8 character passwords', () => {
      expect(AUTH_LIMITS.MIN_PASSWORD_LENGTH).toBe(8);
    });

    it('limits email length to 254 characters (RFC standard)', () => {
      expect(AUTH_LIMITS.MAX_EMAIL_LENGTH).toBe(254);
    });

    it('limits name length to 50 characters', () => {
      expect(AUTH_LIMITS.MAX_NAME_LENGTH).toBe(50);
    });
  });
});
