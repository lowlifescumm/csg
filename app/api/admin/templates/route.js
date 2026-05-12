import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { authOptions } from '@/lib/auth-config';
import { pool } from '@/lib/db.js';
import { sanitizeTemplate, validateTemplateSize } from '@/lib/template-sanitizer.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TEMPLATE_SIZE_KB = 1000; // Increased to 1MB to accommodate larger templates

/**
 * GET /api/admin/templates
 * List templates (admin can see all, users see only their own)
 */
export async function GET(request) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = authResult.role === 'admin';
    const userId = authResult.userId?.toString();

    const client = await pool.connect();
    try {
      // Admin can see all templates, users see only their own
      let result;
      if (isAdmin) {
        result = await client.query(
          'SELECT id, name, owner_id, template_json, report_type, created_at, updated_at FROM report_templates ORDER BY created_at DESC'
        );

        // If no results, try legacy pdf_templates table
        if (result.rows.length === 0) {
          result = await client.query(
            `SELECT id::text, name, created_by as owner_id, template_json, report_type, created_at, updated_at 
             FROM pdf_templates 
             WHERE is_active = true 
             ORDER BY created_at DESC`
          );
        }
      } else {
        // Non-admin users see only their own templates
        result = await client.query(
          'SELECT id, name, owner_id, template_json, report_type, created_at, updated_at FROM report_templates WHERE owner_id = $1 ORDER BY created_at DESC',
          [userId]
        );
      }

      return NextResponse.json({
        success: true,
        templates: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          owner_id: row.owner_id,
          template_json: row.template_json,
          report_type: row.report_type,
          created_at: row.created_at,
          updated_at: row.updated_at,
        })),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('[Admin Templates] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/templates
 * Create a new template (admin only)
 * 
 * Body: {
 *   name: string (required)
 *   template_json: object (required) - The pdfme template JSON
 *   report_type?: string - Report type (ESSENTIAL, ADVANCED, MASTER, etc.)
 *   owner_id?: string - Owner identifier (defaults to 'internal')
 *   preview_html?: string - Optional preview HTML
 * }
 */
export async function POST(request) {
  try {
    // Authenticate user
    const authResult = await getAuthenticatedUser(request.cookies, authOptions);
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = authResult.role === 'admin';
    const userId = authResult.userId?.toString();
    
    // Allow any authenticated user to create templates (not just admins)
    // Admins can create templates for others, regular users can only create for themselves

    const body = await request.json();
    const { name, template_json, report_type, owner_id, preview_html, id: templateId } = body;
    
    // Check if this is an update (PUT) or create (POST)
    const isUpdate = !!templateId;
    
    if (isUpdate) {
      // For updates, verify ownership (admin can update any, users can only update their own)
      const client = await pool.connect();
      try {
        const existingTemplate = await client.query(
          'SELECT owner_id FROM report_templates WHERE id = $1',
          [templateId]
        );
        
        if (existingTemplate.rows.length === 0) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        
        const templateOwner = existingTemplate.rows[0].owner_id;
        if (!isAdmin && templateOwner !== userId) {
          return NextResponse.json({ 
            error: 'Forbidden - You can only edit your own templates' 
          }, { status: 403 });
        }
      } finally {
        client.release();
      }
    }

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (!template_json) {
      return NextResponse.json(
        { error: 'template_json is required' },
        { status: 400 }
      );
    }

    // Validate template size (1000KB / 1MB limit)
    const sizeCheck = validateTemplateSize(template_json, MAX_TEMPLATE_SIZE_KB);
    if (!sizeCheck.valid) {
      return NextResponse.json(
        { 
          error: `Template size exceeds maximum allowed size of ${MAX_TEMPLATE_SIZE_KB}KB`,
          details: `Template size: ${sizeCheck.sizeKB}KB (max: ${sizeCheck.maxSizeKB}KB)`
        },
        { status: 400 }
      );
    }

    // Sanitize template to remove malicious scripts
    let sanitizedTemplate;
    try {
      const templateObj = typeof template_json === 'string' 
        ? JSON.parse(template_json) 
        : template_json;
      sanitizedTemplate = sanitizeTemplate(templateObj);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in template_json', details: parseError.message },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      // Determine owner_id - use authenticated user's ID if not provided
      // Non-admin users: always use their own userId (ignore provided owner_id)
      // Admins: can set owner_id to any value, default to userId if not provided
      const finalOwnerId = isAdmin 
        ? (owner_id || userId || 'internal')
        : (userId || 'internal');
      
      // Non-admin users cannot explicitly set owner_id to someone else's ID
      // (This check is now redundant since we override it above, but kept for clarity)
      if (!isAdmin && owner_id && owner_id !== userId && owner_id !== 'internal') {
        return NextResponse.json({ 
          error: 'Forbidden - You cannot create templates for other users' 
        }, { status: 403 });
      }

      if (isUpdate) {
        // Update existing template with atomic ownership check to prevent TOCTOU race condition
        // The WHERE clause ensures only the owner (or admin) can update the template
        const result = await client.query(
          `UPDATE report_templates
           SET name = $1, template_json = $2, preview_html = $3, report_type = $4, updated_at = now()
           WHERE id = $5 AND (owner_id = $6 OR $7 = true)
           RETURNING id, name, created_at, owner_id`,
          [
            name.trim(),
            sanitizedTemplate,
            preview_html ? sanitizeTemplate({ preview_html }).preview_html : null,
            report_type || null,
            templateId,
            userId,
            isAdmin,
          ]
        );

        if (result.rows.length === 0) {
          // Check if template exists to provide appropriate error message
          const existsCheck = await client.query(
            'SELECT id FROM report_templates WHERE id = $1',
            [templateId]
          );
          if (existsCheck.rows.length === 0) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
          }
          // Template exists but user doesn't have permission
          return NextResponse.json({
            error: 'Forbidden - You can only edit your own templates'
          }, { status: 403 });
        }
        
        const template = result.rows[0];
        return NextResponse.json({
          success: true,
          id: template.id,
          name: template.name,
          created_at: template.created_at,
          message: 'Template updated successfully',
        });
      } else {
        // Insert new template with sanitized JSON
        const result = await client.query(
          `INSERT INTO report_templates (name, owner_id, template_json, preview_html, report_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, created_at, owner_id`,
          [
            name.trim(),
            finalOwnerId,
            sanitizedTemplate,
            preview_html ? sanitizeTemplate({ preview_html }).preview_html : null,
            report_type || null,
          ]
        );

        const template = result.rows[0];

        logger.info('[Admin Templates] Template saved:', {
          id: template.id,
          name: template.name,
        });

        return NextResponse.json({
          success: true,
          id: template.id,
          name: template.name,
          created_at: template.created_at,
          message: 'Template saved successfully',
        });
      }
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('[Admin Templates] POST error:', error);
    
    // Handle JSON parse errors
    if (error.message && error.message.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid JSON in template_json', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save template', details: error.message },
      { status: 500 }
    );
  }
}

