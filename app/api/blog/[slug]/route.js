import { NextResponse } from 'next/server';
import { sanityClient } from '@/lib/sanity';
import { fetchPostBySlug, sanityHasBlogPosts } from '@/lib/sanity-blog-api';

export const dynamic = 'force-dynamic';

// GET /api/blog/[slug] — Single post from Sanity
export async function GET(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';

    if (!(await sanityHasBlogPosts())) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const post = await fetchPostBySlug(slug);
    if (!post) {
      return isAdmin ? NextResponse.json({ post: null }) : NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const related = await sanityClient.fetch(
      `*[_type == "blogPost" && status == "published" && slug.current != $slug][0..3]{ title, "slug": slug.current, excerpt, featured_image, published_at }`,
      { slug }
    );

    return NextResponse.json({ post, related });
  } catch (error) {
    console.error('Blog post API error:', error);
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

// DELETE /api/blog/[slug] — Admin only, Sanity
export async function DELETE(request, { params }) {
  try {
    const { slug } = await params;
    if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 });

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const doc = await sanityClient.fetch(`*[_type == "blogPost" && slug.current == $slug][0]{ _id }`, { slug });
    if (!doc) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    await deletePostFromSanity(doc._id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blog post error:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
