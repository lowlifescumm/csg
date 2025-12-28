/**
 * Utility functions for type-safe user ID handling
 * Ensures userId is always converted to Number for database queries
 */

/**
 * Safely parses userId from authentication result or session
 * Converts the ID to a Number for Prisma queries (Integer primary keys)
 * 
 * @param authResult - Result from getAuthenticatedUser() or session object
 * @returns The userId as a Number, or null if invalid/missing
 * 
 * @example
 * ```ts
 * const auth = await getAuthenticatedUser(cookies, authOptions);
 * const userId = parseUserId(auth);
 * if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * 
 * // Use with Prisma
 * const user = await prisma.user.findUnique({ where: { id: userId } });
 * ```
 */
export function parseUserId(
  authResult: { userId?: string | number } | { user?: { id?: string | number } } | null | undefined
): number | null {
  if (!authResult) {
    return null;
  }

  // Handle getAuthenticatedUser result format: { userId, user }
  if ('userId' in authResult && authResult.userId !== undefined && authResult.userId !== null) {
    return parseUserIdValue(authResult.userId);
  }

  // Handle NextAuth session format: { user: { id } }
  if ('user' in authResult && authResult.user?.id !== undefined && authResult.user?.id !== null) {
    return parseUserIdValue(authResult.user.id);
  }

  return null;
}

/**
 * Safely converts a userId value to a Number
 * Handles strings, numbers, and edge cases
 * 
 * @param value - The userId value (string or number)
 * @returns The userId as a Number, or null if invalid
 */
function parseUserIdValue(value: string | number): number | null {
  if (typeof value === 'number') {
    // Validate it's a valid integer
    if (!Number.isInteger(value) || value <= 0) {
      console.warn('[parseUserId] Invalid numeric userId:', value);
      return null;
    }
    return value;
  }

  if (typeof value === 'string') {
    // Trim whitespace
    const trimmed = value.trim();
    
    // Empty string is invalid
    if (trimmed === '') {
      return null;
    }

    // Parse as integer
    const parsed = parseInt(trimmed, 10);
    
    // Validate parsing succeeded and result is positive integer
    if (isNaN(parsed) || parsed <= 0 || parsed.toString() !== trimmed) {
      console.warn('[parseUserId] Invalid string userId:', value);
      return null;
    }

    return parsed;
  }

  console.warn('[parseUserId] Unexpected userId type:', typeof value, value);
  return null;
}

/**
 * Type guard to check if userId is valid
 * 
 * @param userId - The userId to validate
 * @returns true if userId is a valid positive integer
 */
export function isValidUserId(userId: unknown): userId is number {
  return typeof userId === 'number' && Number.isInteger(userId) && userId > 0;
}

/**
 * Safely extracts userId from request cookies and auth options
 * Convenience wrapper around getAuthenticatedUser + parseUserId
 * 
 * @param cookies - Next.js cookies object
 * @param authOptions - NextAuth authOptions (optional)
 * @returns The userId as a Number, or null if not authenticated
 * 
 * @example
 * ```ts
 * import { cookies } from 'next/headers';
 * import { authOptions } from '@/lib/auth-config';
 * 
 * const cookieStore = await cookies();
 * const userId = await getUserIdFromSession(cookieStore, authOptions);
 * if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * ```
 */
export async function getUserIdFromSession(
  cookies: any,
  authOptions?: any
): Promise<number | null> {
  try {
    const { getAuthenticatedUser } = await import('@/lib/auth');
    const authResult = await getAuthenticatedUser(cookies, authOptions);
    return parseUserId(authResult);
  } catch (error) {
    console.error('[getUserIdFromSession] Error:', error);
    return null;
  }
}



