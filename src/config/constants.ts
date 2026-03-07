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

export const POST_LIMITS = {
  MAX_CONTENT_LENGTH: 2000,
  MAX_RECIPIENT_NAME_LENGTH: 100,
} as const;

export const AUTH_LIMITS = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_EMAIL_LENGTH: 254,
  MAX_NAME_LENGTH: 50,
} as const;
