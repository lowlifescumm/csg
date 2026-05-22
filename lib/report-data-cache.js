import { createRequire } from "module";
const require = createRequire(import.meta.url);
const logger = require('./logger');
import fs from 'fs';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache', 'report-data');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generate cache key from report type
 */
function getCacheKey(reportType) {
  return `report-data-${reportType.toLowerCase()}.json`;
}

/**
 * Get cached report data
 * @param {string} reportType - Report type (e.g., 'MASTER', 'ADVANCED')
 * @returns {object|null} Cached report data or null if not found
 */
export function getCachedReportData(reportType) {
  try {
    const cacheKey = getCacheKey(reportType);
    const cachePath = path.join(CACHE_DIR, cacheKey);
    
    if (fs.existsSync(cachePath)) {
      const cachedData = fs.readFileSync(cachePath, 'utf-8');
      const parsed = JSON.parse(cachedData);
      logger.info(`[Report Data Cache] ✓ Loaded cached data for ${reportType} (${Math.round(cachedData.length / 1024)}KB)`);
      return parsed;
    }
    
    return null;
  } catch (error) {
    logger.warn(`[Report Data Cache] Error loading cache for ${reportType}:`, error.message);
    return null;
  }
}

/**
 * Save report data to cache
 * @param {string} reportType - Report type
 * @param {object} data - Report data to cache (contentResult, sampleData, calculatedData)
 */
export function setCachedReportData(reportType, data) {
  try {
    const cacheKey = getCacheKey(reportType);
    const cachePath = path.join(CACHE_DIR, cacheKey);
    
    // Add timestamp
    const cacheData = {
      ...data,
      cachedAt: new Date().toISOString(),
      reportType,
    };
    
    fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), 'utf-8');
    const sizeKB = Math.round(JSON.stringify(cacheData).length / 1024);
    logger.info(`[Report Data Cache] ✓ Saved cached data for ${reportType} (${sizeKB}KB)`);
  } catch (error) {
    logger.warn(`[Report Data Cache] Error saving cache for ${reportType}:`, error.message);
  }
}

/**
 * Clear cached report data
 * @param {string} reportType - Report type (optional, clears all if not provided)
 */
export function clearCachedReportData(reportType = null) {
  try {
    if (reportType) {
      const cacheKey = getCacheKey(reportType);
      const cachePath = path.join(CACHE_DIR, cacheKey);
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
        logger.info(`[Report Data Cache] ✓ Cleared cache for ${reportType}`);
      }
    } else {
      // Clear all cache files
      const files = fs.readdirSync(CACHE_DIR);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(CACHE_DIR, file));
        }
      });
      logger.info(`[Report Data Cache] ✓ Cleared all cached report data`);
    }
  } catch (error) {
    logger.warn(`[Report Data Cache] Error clearing cache:`, error.message);
  }
}

/**
 * Check if cache exists for report type
 */
export function hasCachedReportData(reportType) {
  const cacheKey = getCacheKey(reportType);
  const cachePath = path.join(CACHE_DIR, cacheKey);
  return fs.existsSync(cachePath);
}

