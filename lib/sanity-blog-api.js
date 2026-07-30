import { sanityClient, portableTextToPlainText, portableTextToHtml } from '@/lib/sanity'

// ═══════════════════════════════════════════════════════════════
// Sanity Blog API wrapper — reads from Sanity CMS
// Falls back to PostgreSQL via existing lib/db on Sanity errors
// ═══════════════════════════════════════════════════════════════

const GROQ_POSTS = `*[_type == "blogPost" 
  && ($status == "all" || status == $status)
  && ($category == "" || category->name == $category)
  && ($tag == "" || $tag in tags[]->name)
  && ($search == "" || [title, excerpt] match $search)
] | order(publishedAt desc, _createdAt desc) {
  "id": _id,
  title,
  "slug": slug.current,
  excerpt,
  content,
  featuredImage,
  featuredImageUrl,
  status,
  publishedAt,
  _createdAt,
  tags[]->{_id,name,slug},
  category->{_id,name,slug},
  metaTitle,
  metaDescription,
  readingTime,
  author
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
  const offset = (page - 1) * limit

  const params = {
    status: status === 'all' ? 'all' : status,
    category,
    tag,
    search,
    _offset: offset,
    _limit: limit,
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
    if (Array.isArray(post.content)) {
      post.content = portableTextToHtml(post.content)
    }
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
    "featured_image": coalesce(featuredImage.asset->url, featuredImageUrl),
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

  const post = await sanityClient.fetch(query, { slug })
  if (!post) {
    const anyPost = await sanityClient.fetch(`*[_type == "blogPost"][0]{ title, "slug": slug.current }`, {})
    console.log('[sanity-debug] fetchPostBySlug miss', { requested: slug, anyPost })
  }
  if (post?.content && Array.isArray(post.content)) {
    post.content = portableTextToHtml(post.content)
  }
  return post
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
