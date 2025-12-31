import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, getUserById } from '@/lib/auth';
import { pool } from '@/lib/db';

/**
 * PUT /api/admin/advisors/[advisorId]/status
 * Update advisor application status (APPROVED or REJECTED)
 */
export async function PUT(request, { params }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await getUserById(decoded.userId);
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const advisorId = params?.advisorId;
    if (!advisorId) {
      return NextResponse.json({ error: 'Advisor ID is required' }, { status: 400 });
    }

    const advisorUserId = parseInt(advisorId, 10);
    if (isNaN(advisorUserId)) {
      return NextResponse.json({ error: 'Invalid advisor ID' }, { status: 400 });
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const { status } = body;

    // Validate status
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    // Check if advisor profile exists
    const profileCheck = await pool.query(
      'SELECT id, user_id, status FROM advisor_profile WHERE user_id = $1',
      [advisorUserId]
    );

    if (profileCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Advisor profile not found' }, { status: 404 });
    }

    const currentProfile = profileCheck.rows[0];

    // Determine is_advisor value based on status
    const isAdvisor = status === 'APPROVED';

    // Update advisor profile status and is_advisor flag
    const updateResult = await pool.query(
      `UPDATE advisor_profile 
       SET status = $1, 
           is_advisor = $2,
           updated_at = NOW()
       WHERE user_id = $3
       RETURNING 
         id,
         user_id,
         bio,
         specialties,
         is_advisor,
         per_minute_rate,
         phone_number,
         status,
         is_online,
         last_heartbeat_at,
         created_at,
         updated_at`,
      [status, isAdvisor, advisorUserId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update advisor status' },
        { status: 500 }
      );
    }

    // Log action to application_logs
    try {
      await pool.query(
        `INSERT INTO application_logs (admin_id, advisor_id, action, timestamp)
         VALUES ($1, $2, $3, NOW())`,
        [adminUser.id, advisorUserId, status]
      );
    } catch (logError) {
      // Log error but don't fail the request
      console.error('Failed to log application action:', logError);
    }

    const updatedProfile = updateResult.rows[0];

    // Format response
    const profile = {
      id: updatedProfile.id,
      user_id: updatedProfile.user_id,
      bio: updatedProfile.bio,
      specialties: updatedProfile.specialties || [],
      is_advisor: updatedProfile.is_advisor || false,
      per_minute_rate: updatedProfile.per_minute_rate ? parseFloat(updatedProfile.per_minute_rate) : null,
      phone_number: updatedProfile.phone_number || null,
      status: updatedProfile.status || 'PENDING',
      is_online: updatedProfile.is_online || false,
      last_heartbeat_at: updatedProfile.last_heartbeat_at ? new Date(updatedProfile.last_heartbeat_at).toISOString() : null,
      created_at: updatedProfile.created_at ? new Date(updatedProfile.created_at).toISOString() : null,
      updated_at: updatedProfile.updated_at ? new Date(updatedProfile.updated_at).toISOString() : null
    };

    return NextResponse.json({
      success: true,
      data: profile,
      message: `Advisor application ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Admin advisor status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update advisor status' },
      { status: 500 }
    );
  }
}

