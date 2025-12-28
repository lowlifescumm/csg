/**
 * Template HTML Cache
 * Caches compiled HTML for identical payloads to reduce repeat Puppeteer runs
 */

import { createHash } from 'crypto';

// In-memory cache (for production, consider using Redis)
const htmlCache = new Map();

// Cache configuration
const MAX_CACHE_SIZE = 100; // Maximum number of cached entries
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate cache key from template ID and data payload
 * @param {string} templateId - Template ID
 * @param {Object} data - Data payload
 * @returns {string} Cache key
 */
export function generateCacheKey(templateId, data) {
  // Create a deterministic hash of the template ID and data
  const keyData = {
    templateId,
    data: JSON.stringify(data, Object.keys(data).sort()),
  };
  
  const hash = createHash('sha256')
    .update(JSON.stringify(keyData))
    .digest('hex');
  
  return `template:${templateId}:${hash.substring(0, 16)}`;
}

/**
 * Get cached HTML
 * @param {string} cacheKey - Cache key
 * @returns {string|null} Cached HTML or null if not found/expired
 */
export function getCachedHtml(cacheKey) {
  const entry = htmlCache.get(cacheKey);
  
  if (!entry) {
    return null;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    htmlCache.delete(cacheKey);
    return null;
  }
  
  return entry.html;
}

/**
 * Set cached HTML
 * @param {string} cacheKey - Cache key
 * @param {string} html - HTML to cache
 * @param {number} ttlMs - Time to live in milliseconds (optional)
 */
export function setCachedHtml(cacheKey, html, ttlMs = CACHE_TTL_MS) {
  // Evict oldest entries if cache is full
  if (htmlCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first in Map)
    const firstKey = htmlCache.keys().next().value;
    htmlCache.delete(firstKey);
  }
  
  htmlCache.set(cacheKey, {
    html,
    expiresAt: Date.now() + ttlMs,
    createdAt: Date.now(),
  });
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of htmlCache.entries()) {
    if (now > entry.expiresAt) {
      htmlCache.delete(key);
    }
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache() {
  htmlCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  const now = Date.now();
  let expired = 0;
  let active = 0;
  
  for (const entry of htmlCache.values()) {
    if (now > entry.expiresAt) {
      expired++;
    } else {
      active++;
    }
  }
  
  return {
    total: htmlCache.size,
    active,
    expired,
    maxSize: MAX_CACHE_SIZE,
  };
}

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(clearExpiredCache, 5 * 60 * 1000);
}








