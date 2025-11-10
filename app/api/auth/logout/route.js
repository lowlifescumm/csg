import { NextResponse } from 'next/server';

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log a user out.
 *     description: Clears the authentication token cookie.
 *     responses:
 *       200:
 *         description: Logout successful.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  
  response.cookies.delete('auth_token');
  
  return response;
}
