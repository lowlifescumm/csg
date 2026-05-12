
'use client';
const logger = require('../../../lib/logger');

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2, Eye, Calendar, User, Tag, ArrowLeft, Archive, RefreshCw } from 'lucide-react';

export default function BlogAdminPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [changingStatus, setChangingStatus] = useState(null);
  const [deletingPost, setDeletingPost] = useState(null);

  useEffect(() => {
    fetchUser();
    fetchPosts();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        if (data.user.role !== 'admin') {
          window.location.href = '/dashboard';
        }
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      logger.error('Auth error:', error);
      window.location.href = '/login';
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/blog?status=all&limit=50');
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      logger.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (postId, postTitle) => {
    if (!confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingPost(postId);
      const response = await fetch(`/api/blog/${postId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Post deleted successfully!');
        fetchPosts(); // Refresh the list
      } else {
        alert(`Failed to delete post: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Delete error:', error);
      alert('Failed to delete post: ' + error.message);
    } finally {
      setDeletingPost(null);
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    try {
      setChangingStatus(postId);
      
      // Get the current post to update
      const post = posts.find(p => p.id === postId);
      if (!post) {
        alert('Post not found');
        return;
      }

      const response = await fetch('/api/blog', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featured_image: post.featured_image,
          status: newStatus,
          tags: post.tags,
          category: post.category,
          meta_title: post.meta_title,
          meta_description: post.meta_description
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`Post status changed to ${newStatus}!`);
        fetchPosts(); // Refresh the list
      } else {
        alert(`Failed to update status: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      logger.error('Status change error:', error);
      alert('Failed to update status: ' + error.message);
    } finally {
      setChangingStatus(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-purple-600 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
                <p className="text-gray-600">Create and manage blog posts for SEO</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchPosts}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                title="Refresh Posts List"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              
              <Link
                href="/admin/blog/new"
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 smooth-transition apple-shadow"
              >
                <Plus className="w-5 h-5" />
                <span>New Post</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Posts</p>
                <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-600">
                  {posts.filter(p => p.status === 'published').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Drafts</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {posts.filter(p => p.status === 'draft').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                <Edit className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-purple-600">
                  {posts.reduce((sum, post) => sum + (post.view_count || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="glassmorphic rounded-2xl apple-shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-gray-900">All Posts</h2>
          </div>

          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : posts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50/50 smooth-transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          {post.featured_image && (
                            <img
                              src={post.featured_image}
                              alt={post.title}
                              className="w-12 h-12 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {post.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              /{post.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <select
                            value={post.status}
                            onChange={(e) => handleStatusChange(post.id, e.target.value)}
                            disabled={changingStatus === post.id}
                            className={`text-xs font-semibold rounded-full px-2 py-1 border-none cursor-pointer ${getStatusColor(post.status)} disabled:opacity-50`}
                          >
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                            <option value="archived">archived</option>
                          </select>
                          {changingStatus === post.id && (
                            <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {post.author_name ? `${post.author_name} ${post.author_last_name || ''}`.trim() : 'Admin'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {post.published_at ? formatDate(post.published_at) : 'Not published'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {post.view_count || 0}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="text-blue-600 hover:text-blue-700 smooth-transition"
                            title="View Post"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/blog/${post.id}/edit`}
                            className="text-purple-600 hover:text-purple-700 smooth-transition"
                            title="Edit Post"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            disabled={deletingPost === post.id}
                            className="text-red-600 hover:text-red-700 smooth-transition disabled:opacity-50"
                            title="Delete Post"
                          >
                            {deletingPost === post.id ? (
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-6">Create your first blog post to get started with SEO content.</p>
              <Link
                href="/admin/blog/new"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-500 text-white font-semibold rounded-xl hover:bg-purple-600 smooth-transition apple-shadow"
              >
                <Plus className="w-5 h-5" />
                <span>Create First Post</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
