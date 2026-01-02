import { pool } from '@/lib/db';
import Link from 'next/link';
import { Calendar, Clock, User, ArrowLeft, BookOpen, Tag } from 'lucide-react';
import ShareButton from './ShareButton';
import { notFound } from 'next/navigation';

const SITE_URL = 'https://cosmicspiritguide.com';

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatContent(content) {
  if (!content) return '';
  
  // Check if content is already HTML (starts with HTML tag)
  const isHTML = /^\s*</.test(content.trim());
  
  if (isHTML) {
    // Content is already HTML - return as-is (trusted admin content)
    return content;
  }
  
  // Convert plain text to HTML with proper formatting
  return content
    // Convert line breaks to <br> tags
    .replace(/\n/g, '<br>')
    // Convert double line breaks to paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Wrap in paragraph tags if not already wrapped
    .replace(/^(?!<p>)/, '<p>')
    .replace(/(?!<\/p>)$/, '</p>')
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, '')
    // Convert **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert URLs to links
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-700 underline">$1</a>');
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  try {
    // Fetch blog post directly from database
    const postQuery = `
      SELECT 
        bp.*,
        u.first_name as author_name,
        u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.slug = $1 AND bp.status = 'published'
    `;

    const postResult = await pool.query(postQuery, [slug]);

    if (postResult.rows.length === 0) {
      notFound();
    }

    const post = postResult.rows[0];

    // Get related posts
    const relatedQuery = `
      SELECT id, title, slug, excerpt, content, featured_image, published_at
      FROM blog_posts 
      WHERE status = 'published' 
        AND id != $1 
        AND (category = $2 OR $3 = ANY(tags))
      ORDER BY published_at DESC
      LIMIT 3
    `;
    const relatedResult = await pool.query(relatedQuery, [post.id, post.category, post.tags]);
    const relatedPosts = relatedResult.rows;

    // Generate structured data for SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || post.meta_description,
      image: post.featured_image || `${SITE_URL}/CSG_LOGO.svg`,
      datePublished: post.published_at,
      dateModified: post.updated_at || post.published_at,
      author: {
        '@type': 'Person',
        name: post.author_name ? `${post.author_name} ${post.author_last_name || ''}`.trim() : 'Cosmic Spiritual Guide'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Cosmic Spiritual Guide',
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/CSG_LOGO.svg`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/blog/${post.slug}`
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/blog"
                className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 smooth-transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Blog</span>
              </Link>
              
              <ShareButton 
                title={post.title} 
                excerpt={post.excerpt} 
                url={`${SITE_URL}/blog/${post.slug}`}
              />
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Article Header */}
          <header className="mb-8">
            <div className="glassmorphic rounded-2xl p-8 apple-shadow-lg">
              {post.featured_image && (
                <div className="aspect-video overflow-hidden rounded-xl mb-6">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.reading_time || 5} min read</span>
                </div>
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{post.author_name ? `${post.author_name} ${post.author_last_name || ''}`.trim() : 'Admin'}</span>
                </div>
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-gray-600 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full flex items-center space-x-1"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </header>

          {/* Article Content */}
          <article className="glassmorphic rounded-2xl p-8 apple-shadow-lg mb-8">
            <div 
              className="prose prose-lg prose-gray max-w-none prose-img:rounded-xl prose-img:shadow-lg prose-img:my-8 prose-a:text-purple-600 prose-a:hover:text-purple-700 prose-strong:text-gray-900 prose-headings:text-gray-900"
              dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
            />
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <article key={relatedPost.id} className="glassmorphic rounded-2xl overflow-hidden apple-shadow-lg hover:shadow-xl smooth-transition group">
                    {relatedPost.featured_image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 smooth-transition"
                        />
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 smooth-transition">
                        <Link href={`/blog/${relatedPost.slug}`}>
                          {relatedPost.title}
                        </Link>
                      </h3>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {relatedPost.excerpt || (relatedPost.content ? relatedPost.content.substring(0, 100) + '...' : '')}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <time dateTime={relatedPost.published_at}>{formatDate(relatedPost.published_at)}</time>
                        <Link
                          href={`/blog/${relatedPost.slug}`}
                          className="text-purple-600 hover:text-purple-700 font-medium smooth-transition"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }
}
