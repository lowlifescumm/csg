'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Calendar, Tag, Image, FileText } from 'lucide-react';

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [post, setPost] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    status: 'draft',
    tags: [],
    category: '',
    meta_title: '',
    meta_description: ''
  });

  useEffect(() => {
    fetchUser();
    if (postId) {
      fetchPost();
    }
  }, [postId]);

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
      console.error('Auth error:', error);
      window.location.href = '/login';
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.url) {
        setPost(prev => ({ ...prev, featured_image: data.url }));
      } else {
        console.error('Upload failed:', data);
        alert('Failed to upload image: ' + (data.error || 'Unknown error') + (data.details ? ' - ' + data.details : ''));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${postId}?admin=true`);
      const data = await response.json();
      
      if (response.ok && data.post) {
        setPost({
          title: data.post.title || '',
          slug: data.post.slug || '',
          excerpt: data.post.excerpt || '',
          content: data.post.content || '',
          featured_image: data.post.featured_image || '',
          status: data.post.status || 'draft',
          tags: data.post.tags || [],
          category: data.post.category || '',
          meta_title: data.post.meta_title || '',
          meta_description: data.post.meta_description || ''
        });
        
        // Auto-detect HTML mode if content starts with HTML tag
        if (data.post.content && /^\s*</.test(data.post.content.trim())) {
          setHtmlMode(true);
        }
      } else {
        console.error('Failed to fetch post:', data.error);
        alert('Failed to load post: ' + (data.error || 'Post not found'));
        router.push('/admin/blog');
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
      alert('Failed to load post: ' + error.message);
      router.push('/admin/blog');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title) => {
    setPost(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      meta_title: title
    }));
  };

  const handleSave = async (status = 'draft', event) => {
    if (event) {
      event.preventDefault();
    }
    
    try {
      setSaving(true);
      
      // Validate required fields
      if (!post.title.trim()) {
        alert('Please enter a title');
        setSaving(false);
        return;
      }
      
      // Only require content when publishing
      if (status === 'published' && !post.content.trim()) {
        alert('Please enter content to publish');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/blog', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: postId,
          ...post,
          status,
          author_id: user.id
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Blog post updated successfully!');
        router.push('/admin/blog');
      } else {
        console.error('Failed to update post:', data);
        alert('Failed to update post: ' + (data.error || 'Unknown error') + (data.details ? ' - ' + data.details : ''));
      }
    } catch (error) {
      console.error('Failed to update post:', error);
      alert('Failed to update post: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setPost(prev => ({ ...prev, [key]: value }));
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading post...</p>
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
              <Link href="/admin/blog" className="text-gray-600 hover:text-purple-600 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
                <p className="text-gray-600">Update your blog post content</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => handleSave('draft', e)}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 smooth-transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </button>
              <button
                onClick={(e) => handleSave('published', e)}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 smooth-transition disabled:opacity-50"
              >
                <Eye className="w-4 h-4" />
                <span>{saving ? 'Publishing...' : 'Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Post Content
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={post.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter post title..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={post.slug}
                    onChange={(e) => setPost(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="post-url-slug"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">URL: /blog/{post.slug}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={post.excerpt}
                    onChange={(e) => setPost(prev => ({ ...prev, excerpt: e.target.value }))}
                    placeholder="Brief description of the post..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Content *
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHtmlMode(!htmlMode)}
                        className="text-xs px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                      >
                        {htmlMode ? 'HTML Mode' : 'Text Mode'}
                      </button>
                    </div>
                  </div>
                  {htmlMode ? (
                    <div className="space-y-2">
                      <textarea
                        value={post.content}
                        onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                        placeholder="Paste your HTML here... You can include images with &lt;img src=&quot;url&quot; /&gt; tags"
                        rows={16}
                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500">
                        💡 HTML Mode: Paste raw HTML with images. Images will be displayed as-is.
                      </p>
                    </div>
                  ) : (
                    <textarea
                      value={post.content}
                      onChange={(e) => setPost(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your post content here... (Use HTML Mode to paste HTML with images)"
                      rows={12}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Post Settings */}
            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-500" />
                Post Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={post.status}
                    onChange={(e) => setPost(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={post.category}
                    onChange={(e) => setPost(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Astrology, Tarot, Spirituality"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={post.tags.join(', ')}
                    onChange={(e) => setPost(prev => ({ ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) }))}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-purple-500" />
                Featured Image
              </h3>
              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <input
                    type="file"
                    id="imageUploadEdit"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="imageUploadEdit"
                    className={`cursor-pointer flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 smooth-transition text-gray-600 hover:text-purple-600 ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="flex items-center gap-2">
                      <Image className="w-5 h-5" />
                      {uploadingImage ? 'Uploading...' : 'Click to upload image (max 10MB)'}
                    </span>
                  </label>
                </div>
                
                {/* Manual URL input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or enter image URL
                  </label>
                  <input
                    type="url"
                    value={post.featured_image}
                    onChange={(e) => setPost(prev => ({ ...prev, featured_image: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                
                {/* Preview */}
                {post.featured_image && (
                  <div>
                    <img
                      src={post.featured_image}
                      alt="Featured image preview"
                      className="w-full h-32 object-cover rounded-xl"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* SEO Settings */}
            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-500" />
                SEO Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={post.meta_title}
                    onChange={(e) => setPost(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title for search engines"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <textarea
                    value={post.meta_description}
                    onChange={(e) => setPost(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="SEO description for search engines"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
