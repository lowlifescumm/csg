import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { createPostInSanity, updatePostInSanity, deletePostFromSanity } from '@/lib/sanity-write.js';
import { fetchPostsFromSanity, fetchPostBySlug, sanityHasBlogPosts } from '@/lib/sanity-blog-api';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 96) || 'uncategorized';
}

// GET /api/blog - List blog posts
export async function GET(request) {
  try {
    const hasPosts = await sanityHasBlogPosts();
    if (!hasPosts) {
      return NextResponse.json({ posts: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category') || '';
    const tag = searchParams.get('tag') || '';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'published';

    const result = await fetchPostsFromSanity({ page, limit, category, tag, search, status });
    const posts = (result.posts || []).map((post) => ({
      ...post,
      id: post.slug,
      author_id: typeof post.author === 'string' ? post.author : undefined,
      author_name: typeof post.author === 'string' ? post.author : undefined,
    }));

    return NextResponse.json({
      posts,
      pagination: result.pagination || { page, limit, total: posts.length, pages: 1 },
    });
  } catch (error) {
    console.error('Blog API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

async function authenticate(request) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    if (!process.env.BLOG_API_KEY || apiKey !== process.env.BLOG_API_KEY) {
      return { error: 'Invalid API key', status: 401 };
    }
    return { userId: 'service', isAdmin: true };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) return { error: 'Unauthorized', status: 401 };

  const decoded = verifyToken(token);
  if (!decoded) return { error: 'Unauthorized', status: 401 };

  const user = await sanityClient.fetch('*[_type == "user" && _id == $id][0]{ _id, role }', { id: `user.${decoded.userId}` });
  if (!user || !['admin', 'editor'].includes(user.role)) return { error: 'Forbidden', status: 403 };
  return { userId: decoded.userId, isAdmin: true };
}

// POST /api/blog - Create new blog post
export async function POST(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { title, slug, excerpt, content, featured_image, status = 'draft', tags = [], category, meta_title, meta_description } = body;

    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (status === 'published' && !content) return NextResponse.json({ error: 'Content is required to publish' }, { status: 400 });

    const finalSlug = slugify(slug || title);
    const tagsArray = Array.isArray(tags) ? tags : (tags ? [tags] : []);

    const post = await createPostInSanity({
      title,
      slug: finalSlug,
      excerpt,
      content,
      featured_image,
      status,
      category,
      meta_title: meta_title || title,
      meta_description,
      tags: tagsArray,
      author: typeof auth.userId === 'number' ? String(auth.userId) : 'Cosmic Spirit Guide',
    });

    const responsePost = {
      id: post.slug || finalSlug,
      title,
      slug: post.slug || finalSlug,
      status,
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, post: responsePost });
  } catch (error) {
    console.error('Create blog post error:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}

// PUT /api/blog - Update blog post
export async function PUT(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await request.json();
    const { id, title, slug, excerpt, content, featured_image, status, tags, category, meta_title, meta_description } = body;

    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    const baseSlug = typeof id === 'string' && id.startsWith('blogPost.') ? id.replace(/^blogPost\./, '') : id;
    const doc = await sanityClient.fetch(`*[_type == "blogPost" && slug.current == $slug][0]{ _id }`, { slug: baseSlug });
    if (!doc) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const updated = await updatePostInSanity(doc._id, {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      status,
      category,
      meta_title,
      meta_description,
      tags: Array.isArray(tags) ? tags : tags ? [tags] : [],
    });

    return NextResponse.json({
      success: true,
      post: {
        id: updated.slug || baseSlug,
        slug: updated.slug || baseSlug,
        status: status || 'draft',
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Update blog post error:', error);
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

// DELETE /api/blog - Delete blog post by query id or path slug
export async function DELETE(request) {
  try {
    const auth = await authenticate(request);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');
    const id = rawId || '';

    if (!id) return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });

    const baseSlug = typeof id === 'string' && id.startsWith('blogPost.') ? id.replace(/^blogPost\./, '') : id;
    const doc = await sanityClient.fetch(`*[_type == "blogPost" && slug.current == $slug][0]{ _id }`, { slug: baseSlug });
    if (!doc) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    await deletePostFromSanity(doc._id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
