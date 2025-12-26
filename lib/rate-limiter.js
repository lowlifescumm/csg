/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

// In-memory store (resets on server restart)
const rateLimitStore = new Map();

/**
 * Rate limit check
 * @param {string} identifier - Unique identifier (IP, user ID, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const key = identifier;
  
  let record = rateLimitStore.get(key);
  
  // Clean expired records periodically (every 1000 requests)
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k);
      }
    }
  }
  
  // If no record or window expired, create new record
  if (!record || record.resetAt < now) {
    record = {
      count: 0,
      resetAt: now + windowMs,
    };
  }
  
  // Increment count
  record.count += 1;
  rateLimitStore.set(key, record);
  
  const allowed = record.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - record.count);
  
  return {
    allowed,
    remaining,
    resetAt: record.resetAt,
    count: record.count,
  };
}

/**
 * Get client identifier from request
 * @param {Request} request - Next.js request object
 * @param {string|null} userId - Authenticated user ID (if available)
 * @returns {string} Identifier string
 */
export function getClientIdentifier(request, userId = null) {
  // Use user ID if authenticated (more accurate than IP)
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fallback to IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded 
    ? forwarded.split(',')[0].trim()
    : request.headers.get('x-real-ip') || 'unknown';
  
  return `ip:${ip}`;
}

