import { generatePageMetadata } from '@/lib/metadata';
import { pool } from '@/lib/db';

const SITE_URL = "https://cosmicspiritguide.com";

export async function generateMetadata({ params }) {
  try {
    const { slug } = await params;
    
    // Fetch blog post from database
    const postResult = await pool.query(
      `SELECT title, excerpt, featured_image, meta_title, meta_description, tags, category
       FROM blog_posts 
       WHERE slug = $1 AND status = 'published'`,
      [slug]
    );

    if (postResult.rows.length === 0) {
      // Fallback metadata if post not found
      return generatePageMetadata({
        title: "Blog Post Not Found",
        description: "The blog post you're looking for doesn't exist.",
        path: `/blog/${slug}`,
      });
    }

    const post = postResult.rows[0];
    const title = post.meta_title || post.title;
    const description = post.meta_description || post.excerpt || "Read this spiritual insight on Cosmic Spiritual Guide.";
    const image = post.featured_image || `${SITE_URL}/CSG_LOGO.svg`;
    const keywords = post.tags ? post.tags.join(', ') : undefined;

    return generatePageMetadata({
      title,
      description,
      path: `/blog/${slug}`,
      image,
      type: 'article',
      keywords: keywords ? [keywords] : [],
    });
  } catch (error) {
    console.error('Error generating blog post metadata:', error);
    // Fallback metadata on error
    return generatePageMetadata({
      title: "Blog Post",
      description: "Read spiritual insights on Cosmic Spiritual Guide.",
      path: `/blog/${slug}`,
    });
  }
}

export default function BlogPostLayout({ children }) {
  return children;
}

