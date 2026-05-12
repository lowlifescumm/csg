import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
import { pool } from '@/lib/db';

export async function POST(request) {
  try {
    // Check authentication (API key or cookie)
    let userId = null;
    const apiKey = request.headers.get('x-api-key');
    
    if (apiKey) {
      if (!process.env.BLOG_API_KEY || apiKey !== process.env.BLOG_API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { rows } = await pool.query(
        "SELECT id FROM users WHERE role='admin' ORDER BY id ASC LIMIT 1"
      );
      userId = rows[0]?.id;
    } else {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const decoded = verifyToken(token);
      if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      userId = decoded.userId;
    }
    
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const url = await uploadImage(buffer, 'blog', 1920);

    return NextResponse.json({ success: true, url });

  } catch (error) {
    logger.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image', details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

