import { pool } from '@/lib/db';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import BlogClient from './BlogClient';

async function getBlogData() {
  try {
    // Fetch initial blog posts
    const postsResult = await pool.query(
      `SELECT 
        bp.*,
        u.first_name as author_name,
        u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      WHERE bp.status = 'published'
      ORDER BY bp.published_at DESC, bp.created_at DESC
      LIMIT 9`
    );

    // Get total count for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM blog_posts WHERE status = $1',
      ['published']
    );
    const total = parseInt(countResult.rows[0].total);

    // Fetch categories
    const categoriesResult = await pool.query(
      'SELECT name, slug FROM blog_categories ORDER BY name ASC'
    );

    // Fetch tags
    const tagsResult = await pool.query(
      'SELECT name, slug FROM blog_tags ORDER BY name ASC'
    );

    return {
      posts: postsResult.rows,
      categories: categoriesResult.rows,
      tags: tagsResult.rows,
      pagination: {
        page: 1,
        limit: 9,
        total,
        pages: Math.ceil(total / 9)
      }
    };
  } catch (error) {
    console.error('Error fetching blog data:', error);
    return {
      posts: [],
      categories: [],
      tags: [],
      pagination: { page: 1, limit: 9, total: 0, pages: 0 }
    };
  }
}

export default async function BlogPage() {
  const { posts, categories, tags, pagination } = await getBlogData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mr-4">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Spiritual Blog</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Discover insights into astrology, tarot, spirituality, and cosmic guidance through our expert articles
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Detailed Introduction */}
        <div className="glassmorphic rounded-2xl p-8 mb-8 apple-shadow-lg bg-white/70">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to the Cosmic Spiritual Guide blog, your comprehensive resource for exploring the mystical realms of astrology, tarot reading, and spiritual wisdom. Our expertly crafted articles are designed to illuminate your path, whether you&apos;re seeking guidance on matters of the heart, career decisions, personal growth, or simply a deeper understanding of the cosmic forces that shape our lives.
            </p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Each piece in our collection is thoughtfully written to bridge ancient wisdom with modern insights, making complex astrological concepts accessible and practical. From detailed birth chart interpretations to tarot card meanings and their applications in daily life, our content serves both beginners taking their first steps into spiritual exploration and seasoned practitioners looking to deepen their understanding.
            </p>
            <p className="text-gray-700 leading-relaxed">
              We explore a wide range of topics including planetary transits and their impact on personal growth, the significance of moon phases in spiritual practice, compatibility analysis for relationships, and practical advice for incorporating spiritual practices into your everyday routine. Our articles are regularly updated with the latest astrological events, seasonal insights, and timeless teachings that resonate across cultures and traditions. Dive into our archives to discover how the cosmos can guide you toward greater self-awareness, fulfillment, and alignment with your highest potential.
            </p>
          </div>
        </div>

        {/* Client component with server-rendered initial data - links in HTML for crawlers */}
        <BlogClient 
          initialPosts={posts}
          initialCategories={categories}
          initialTags={tags}
          initialPagination={pagination}
        />
      </div>
    </div>
  );
}
