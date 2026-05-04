import { sanityClient, portableTextToPlainText } from '@/lib/sanity'

// ═══════════════════════════════════════════════════════════════
// Sanity Blog API wrapper — reads from Sanity CMS
// Falls back to PostgreSQL via existing lib/db on Sanity errors
// ═══════════════════════════════════════════════════════════════

const GROQ_POSTS = `*[_type == "blogPost" 
  && ($status == "all" || status == $status)
  && ($category == "" || category->name == $category)
  && ($tag == "" || $tag in tags[]->name)
  && ($search == "" || [title, excerpt] match $search)
]|desc(publishedAt, _createdAt)
{}
[_start..._end]
{
  "id": _id,
  title,
  "slug": slug.current,
  excerpt,
  content,
  "featured_image": featuredImage.asset->url,
  status,
  "published_at": publishedAt,
  "created_at": _createdAt,
  "tags": tags[]->name,
  "category": category->name,
  "meta_title": metaTitle,
  "meta_description": metaDescription,
  "reading_time": readingTime,
  "author_name": author,
  "view_count": 0
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
  const start = (page - 1) * limit
  const end = start + limit

  const params = {
    status: status === 'all' ? 'all' : status,
    category,
    tag,
    search,
    _start: start,
    _end: end,
  }

  // Fetch posts and count in parallel
  const [posts, total] = await Promise.all([
    sanityClient.fetch(GROQ_POSTS, params),
    sanityClient.fetch(GROQ_COUNT, params),
  ])

  // Convert Portable Text content to plain text excerpt if missing
  for (const post of posts) {
    if (!post.excerpt && post.content) {
      const text = portableTextToPlainText(post.content)
      post.excerpt = text.slice(0, 300) + (text.length > 300 ? '...' : '')
    }
    // Keep content as-is (Portable Text). Frontend can render it or use plain-text converter.
  }

  return {
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

/**
 * Fetch a single post by slug
 */
export async function fetchPostBySlug(slug) {
  const query = `*[_type == "blogPost" && slug.current == $slug][0]
  {
    "id": _id,
    title,
    "slug": slug.current,
    excerpt,
    content,
    "featured_image": featuredImage.asset->url,
    status,
    "published_at": publishedAt,
    "created_at": _createdAt,
    "tags": tags[]->name,
    "category": category->name,
    "meta_title": metaTitle,
    "meta_description": metaDescription,
    "reading_time": readingTime,
    "author_name": author,
    "view_count": 0
  }`

  return sanityClient.fetch(query, { slug })
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
