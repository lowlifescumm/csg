const logger = require('./logger');
/**
 * Image Inliner
 * Fetches external images and converts them to base64 data URIs
 * to avoid external fetch in Puppeteer at render time
 */

/**
 * Check if a string is a valid image URL
 * @param {string} url - URL to check
 * @returns {boolean} True if valid image URL
 */
function isImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  // Skip data URIs (already inlined)
  if (url.startsWith('data:image/')) {
    return false;
  }
  
  // Check if it's a valid URL
  try {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol;
    
    // Only allow http/https
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }
    
    // Check if it looks like an image URL (optional, can be more permissive)
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    const pathname = parsedUrl.pathname.toLowerCase();
    const isImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
    
    // Allow all http/https URLs (let fetch determine if it's an image)
    return true;
  } catch (err) {
    logger.error("[image-inliner] URL validation error:", err);
    return false;
  }
}

/**
 * Fetch image and convert to base64 data URI
 * @param {string} imageUrl - Image URL to fetch
 * @param {number} maxSizeMB - Maximum image size in MB (default: 5MB)
 * @returns {Promise<string>} Data URI string
 */
export async function inlineImage(imageUrl, maxSizeMB = 5) {
  if (!isImageUrl(imageUrl)) {
    return imageUrl; // Return as-is if not an image URL
  }
  
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'CosmicSpiritualGuide/1.0',
      },
      // Timeout after 5 seconds
      signal: AbortSignal.timeout(5000),
    });
    
    if (!response.ok) {
      logger.warn(`[Image Inliner] Failed to fetch image: ${imageUrl} (${response.status})`);
      return imageUrl; // Return original URL on failure
    }
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      logger.warn(`[Image Inliner] URL does not return an image: ${imageUrl} (${contentType})`);
      return imageUrl; // Return original URL
    }
    
    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const sizeMB = parseInt(contentLength, 10) / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        logger.warn(`[Image Inliner] Image too large: ${imageUrl} (${sizeMB.toFixed(2)}MB, max: ${maxSizeMB}MB)`);
        return imageUrl; // Return original URL
      }
    }
    
    // Fetch image buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check size after fetch (for cases where content-length was not provided)
    const sizeMB = buffer.length / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      logger.warn(`[Image Inliner] Image too large after fetch: ${imageUrl} (${sizeMB.toFixed(2)}MB, max: ${maxSizeMB}MB)`);
      return imageUrl; // Return original URL
    }
    
    // Convert to base64 data URI
    const base64 = buffer.toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;
    
    logger.info(`[Image Inliner] Inlined image: ${imageUrl} (${sizeMB.toFixed(2)}MB)`);
    
    return dataUri;
  } catch (error) {
    logger.error(`[Image Inliner] Error inlining image ${imageUrl}:`, error.message);
    return imageUrl; // Return original URL on error
  }
}

/**
 * Find and inline all image URLs in HTML string
 * @param {string} html - HTML string
 * @returns {Promise<string>} HTML with inlined images
 */
export async function inlineImagesInHtml(html) {
  if (!html || typeof html !== 'string') {
    return html;
  }
  
  // Find all img src attributes
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const matches = [...html.matchAll(imgSrcRegex)];
  
  if (matches.length === 0) {
    return html; // No images to inline
  }
  
  // Inline images in parallel (limit to 5 concurrent requests)
  const imageUrls = [...new Set(matches.map(m => m[1]))]; // Unique URLs
  const inlinedUrls = new Map();
  
  // Process in batches to avoid overwhelming the server
  const batchSize = 5;
  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(url => inlineImage(url).then(inlined => ({ url, inlined })))
    );
    
    results.forEach(({ url, inlined }) => {
      inlinedUrls.set(url, inlined);
    });
  }
  
  // Replace URLs in HTML
  let inlinedHtml = html;
  matches.forEach(match => {
    const originalUrl = match[1];
    const inlinedUrl = inlinedUrls.get(originalUrl);
    if (inlinedUrl && inlinedUrl !== originalUrl) {
      inlinedHtml = inlinedHtml.replace(
        new RegExp(`src=["']${originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'g'),
        `src="${inlinedUrl}"`
      );
    }
  });
  
  return inlinedHtml;
}

