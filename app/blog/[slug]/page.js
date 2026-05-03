import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, Clock, User, ArrowLeft, Share2, BookOpen, Tag } from 'lucide-react';
import { getBlogPostBySlug } from '@/lib/blog-server';
import { BlogRelatedServices } from '@/components/RelatedServices';
import { getServicesForCategory, extractKeywordLinks } from '@/lib/internal-links/service-map';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const result = await getBlogPostBySlug(slug);
  
  if (!result?.post) {
    return {
      title: 'Article Not Found | Cosmic Spirit Guide',
    };
  }

  const { post } = result;
  
  return {
    title: `${post.title} | Cosmic Spirit Guide`,
    description: post.excerpt || post.meta_description || `Read ${post.title} on Cosmic Spirit Guide`,
    openGraph: post.featured_image ? {
      images: [post.featured_image],
    } : undefined,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const result = await getBlogPostBySlug(slug);
  
  if (!result?.post) {
    notFound();
  }

  const { post, related } = result;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content) => {
    if (!content) return '';
    
    // Check if content is already HTML (starts with HTML tag)
    const isHTML = /^\s*</.test(content.trim());
    
    if (isHTML) {
      // Content is already HTML - return as-is (trusted admin content)
      return content;
    }
    
    // Convert plain text to HTML with proper formatting
    return content
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert line breaks to <br> tags
      .replace(/\n/g, '<br>')
      // Convert double line breaks to paragraphs
      .replace(/<br><br>/g, '</p><p>')
      // Wrap in paragraph tags if not already wrapped
      .replace(/^(?!<p>)/, '<p>')
      .replace(/(?!<\/p>)$/, '</p>')
      // Clean up empty paragraphs
      .replace(/<p><\/p>/g, '')
      // Convert URLs to links
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-purple-600 hover:text-purple-700 underline">$1</a>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
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
                <span>{formatDate(post.published_at)}</span>
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

        {/* Contextual Service Links */}
        <div className="mb-8">
          <BlogRelatedServices 
            category={post.category} 
            tags={post.tags}
            maxServices={3}
          />
        </div>

        {/* Related Posts */}
        {related && related.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((relatedPost) => (
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
                      <span>{formatDate(relatedPost.published_at)}</span>
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
}
