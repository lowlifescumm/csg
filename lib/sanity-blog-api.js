import { sanityClient, portableTextToHtml } from '@/lib/sanity'

const SANITY_CDN = 'https://cdn.sanity.io/images/kicslgfz/production';

// Build a usable CDN URL from a Sanity image object ({ asset: { _ref } })
// Routed through the same-origin /api/img proxy because Sanity CDN blocks
// browser requests via CORS (403), which ORB then blocks in the browser.
function buildImageUrl(image) {
  const ref = image?.asset?._ref;
  if (!ref) return '';
  const assetPath = ref.replace(/^image-/, '');
  return `/api/img?u=${encodeURIComponent(`${SANITY_CDN}/${assetPath}?fm=webp`)}`;
}

// ═══════════════════════════════════════════════════════════════
// Sanity Blog API wrapper — reads from Sanity CMS
// Falls back to PostgreSQL via existing lib/db on Sanity errors
// ═══════════════════════════════════════════════════════════════

const GROQ_LIST = `*[_type == "blogPost"] | order(_createdAt desc) {
  _id,
  title,
  "slug": slug.current,
  status,
  publishedAt
}`

const GROQ_COUNT = `count(*[_type == "blogPost" 
  && ($status == "all" || status == $status)
  && ($category == "" || category->name == $category)
  && ($tag == "" || $tag in tags[]->name)
  && ($search == "" || [title, excerpt] match $search)
])`

/**
 * Fetch posts from Sanity with the same response shape as the old PostgreSQL API.
 */
export async function fetchPostsFromSanity({ page = 1, limit = 10, category = '', tag = '', search = '', status = 'published' }) {
  const raw = await sanityClient.fetch(GROQ_LIST)
  const posts = (raw || [])
    .filter((post) => {
      if (status !== 'all' && post.status !== status) return false
      return true
    })
    .sort((a, b) => new Date(b._createdAt || 0) - new Date(a._createdAt || 0))
    .slice((page - 1) * limit, page * limit)
    .map((post) => ({
      id: post.slug || post._id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      content: post.content || '',
      featured_image: post.featuredImageUrl || '',
      status: post.status || status,
      published_at: post.publishedAt || null,
      created_at: post._createdAt || null,
      tags: [],
      category: '',
      meta_title: post.metaTitle || post.title,
      meta_description: post.metaDescription || post.excerpt || '',
      reading_time: post.readingTime || 5,
      author_name: post.author || 'Cosmic Spirit Guide',
      view_count: 0,
    }))

  return {
    posts,
    pagination: {
      page,
      limit,
      total: posts.length,
      pages: Math.max(1, Math.ceil(posts.length / limit)),
    },
  }
}

/**
 * Fetch a single post by slug
 */
function normalizePost(post) {
  if (!post) return post
  return {
    ...post,
    id: post.slug || post._id,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt || '',
    content: Array.isArray(post.content) ? portableTextToHtml(post.content) : post.content || '',
    featured_image: buildImageUrl(post.featuredImage) || '',
    status: post.status || 'published',
    published_at: post.publishedAt || null,
    created_at: post._createdAt || null,
    tags: [],
    category: '',
    meta_title: post.metaTitle || post.title,
    meta_description: post.metaDescription || post.excerpt || '',
    reading_time: post.readingTime || 5,
    author_name: typeof post.author === 'string' ? post.author : '',
    author_last_name: '',
    view_count: 0,
  }
}

export async function fetchPostBySlug(slug) {
  const query = `*[_type == "blogPost" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    content,
    featuredImage,
    featuredImageUrl,
    status,
    publishedAt,
    _createdAt,
    tags,
    category,
    metaTitle,
    metaDescription,
    readingTime,
    author
  }`
  const post = await sanityClient.fetch(query, { slug })
  return normalizePost(post)
}

/**
 * Check if Sanity is available (has content)
 */
export async function sanityHasBlogPosts() {
  try {
    const count = await sanityClient.fetch('count(*[_type == "blogPost"])')
    return count > 0
  } catch {
    return false
  }
}
