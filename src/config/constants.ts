/**
 * Application configuration constants
 */

export const POLLING_INTERVALS = {
  NOTIFICATIONS: 30000, // 30 seconds
} as const;

export const FEED_LIMITS = {
  DEFAULT: 50,
  TOP_STORIES: 20,
} as const;

export const SEARCH_CONFIG = {
  MIN_CHARACTERS: 2,
  MAX_RESULTS: 5,
} as const;
