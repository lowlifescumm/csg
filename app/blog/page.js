import Link from 'next/link';
import { Calendar, Clock, User, Search, Tag, Filter, ArrowRight, BookOpen } from 'lucide-react';
import { getBlogPosts, getBlogCategories, getBlogTags } from '@/lib/blog-server';

export const metadata = {
  title: "Spiritual Blog | Cosmic Spirit Guide",
  description: "Discover insights into astrology, tarot, spirituality, and cosmic guidance through our expert articles",
};

export default async function BlogPage({ searchParams }) {
  // Get query params from URL
  const params = await searchParams;
  const page = parseInt(params?.page || '1');
  const category = params?.category || '';
  const tag = params?.tag || '';
  const search = params?.search || '';

  // Fetch data server-side
  const [{ posts, pagination }, categories, tags] = await Promise.all([
    getBlogPosts({ page, limit: 9, category, tag, search }),
    getBlogCategories(),
    getBlogTags()
  ]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingTime = (content) => {
    if (!content) return 5;
    const wordsPerMinute = 200;
    const wordCount = content.split(' ').length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

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
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover insights into astrology, tarot, spirituality, and cosmic guidance through our expert articles
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="glassmorphic rounded-2xl p-6 mb-8 apple-shadow-lg">
          <form className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search articles..."
                  defaultValue={search}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none bg-white/70"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                name="category"
                defaultValue={category}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none bg-white/70"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="lg:w-48">
              <select
                name="tag"
                defaultValue={tag}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none bg-white/70"
              >
                <option value="">All Tags</option>
                {tags.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 smooth-transition apple-shadow flex items-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>
          </form>
        </div>

        {/* Blog Posts Grid */}
        {posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article key={post.id} className="glassmorphic rounded-2xl overflow-hidden apple-shadow-lg hover:shadow-xl smooth-transition group">
                  {post.featured_image && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 smooth-transition"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.reading_time || getReadingTime(post.content)} min read</span>
                      </div>
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-purple-600 smooth-transition">
                      <Link href={`/blog/${post.slug}`}>
                        {post.title}
                      </Link>
                    </h2>

                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt || (post.content ? post.content.substring(0, 150) + '...' : '')}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">
                          {post.author_name ? `${post.author_name} ${post.author_last_name || ''}`.trim() : 'Admin'}
                        </span>
                      </div>
                      
                      <Link
                        href={`/blog/${post.slug}`}
                        className="flex items-center space-x-1 text-purple-600 hover:text-purple-700 font-medium smooth-transition"
                      >
                        <span>Read More</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>

                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {post.tags.slice(0, 3).map((tagItem, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {tagItem}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex space-x-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                    <Link
                      key={pageNum}
                      href={`/blog?page=${pageNum}${category ? `&category=${category}` : ''}${tag ? `&tag=${tag}` : ''}${search ? `&search=${search}` : ''}`}
                      className={`px-4 py-2 rounded-lg font-medium smooth-transition ${
                        pageNum === page
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/60 text-gray-700 hover:bg-purple-100'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
