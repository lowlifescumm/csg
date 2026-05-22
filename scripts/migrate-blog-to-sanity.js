import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

// Dynamic import AFTER dotenv loads
const { sanityWriteClient, textToPortableText } = await import('../lib/sanity-write.js')
const { pool } = await import('../lib/db.js')

/**
 * Migrate published blog posts from PostgreSQL to Sanity CMS.
 * Steps:
 *  1. Fetch published posts from PostgreSQL
 *  2. Extract unique categories → create in Sanity
 *  3. Extract unique tags → create in Sanity
 *  4. Create blogPost documents with category/tag references
 */

async function migrate() {
  console.log('=== CSG Blog Migration: PostgreSQL → Sanity ===\n')

  // ─── Step 1: Fetch published posts ──────────────────────────────
  const { rows: posts } = await pool.query(`
    SELECT id, title, slug, excerpt, content, featured_image, status, tags,
           category, meta_title, meta_description, published_at, created_at,
           reading_time, view_count
    FROM blog_posts
    WHERE status = 'published'
    ORDER BY published_at DESC
  `)

  if (posts.length === 0) {
    console.log('No published posts found.')
    return
  }

  console.log(`Found ${posts.length} published posts to migrate\n`)

  // ─── Step 2: Extract unique categories ──────────────────────────
  const categorySet = new Set()
  for (const post of posts) {
    if (post.category) {
      post.category.split(/[,;]/).map(c => c.trim()).filter(Boolean).forEach(c => categorySet.add(c))
    }
  }
  const categories = Array.from(categorySet)
  console.log(`Categories to create: ${categories.join(', ')}`)

  // ─── Step 3: Extract unique tags ─────────────────────────────────
  const tagSet = new Set()
  for (const post of posts) {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(t => tagSet.add(t.trim()))
    }
  }
  const tags = Array.from(tagSet)
  console.log(`Tags to create: ${tags.join(', ')}\n`)

  // ─── Step 4: Create categories in Sanity ────────────────────────
  const categoryRefs = {}
  for (const catName of categories) {
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    try {
      const existing = await sanityWriteClient.fetch(`*[_type == "category" && slug.current == $slug][0]._id`, { slug })
      if (existing) {
        categoryRefs[catName] = { _type: 'reference', _ref: existing }
        console.log(`  Category exists: ${catName} (${existing})`)
        continue
      }

      const doc = await sanityWriteClient.create({
        _type: 'category',
        name: catName,
        slug: { _type: 'slug', current: slug },
      })
      categoryRefs[catName] = { _type: 'reference', _ref: doc._id }
      console.log(`  Created category: ${catName} (${doc._id})`)
    } catch (err) {
      console.error(`  Failed category ${catName}:`, err.message)
    }
  }

  // ─── Step 5: Create tags in Sanity ──────────────────────────────
  const tagRefs = {}
  for (const tagName of tags) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    try {
      const existing = await sanityWriteClient.fetch(`*[_type == "tag" && slug.current == $slug][0]._id`, { slug })
      if (existing) {
        tagRefs[tagName] = { _type: 'reference', _ref: existing }
        console.log(`  Tag exists: ${tagName} (${existing})`)
        continue
      }

      const doc = await sanityWriteClient.create({
        _type: 'tag',
        name: tagName,
        slug: { _type: 'slug', current: slug },
      })
      tagRefs[tagName] = { _type: 'reference', _ref: doc._id }
      console.log(`  Created tag: ${tagName} (${doc._id})`)
    } catch (err) {
      console.error(`  Failed tag ${tagName}:`, err.message)
    }
  }

  // ─── Step 6: Migrate blog posts ─────────────────────────────────
  console.log(`\nMigrating ${posts.length} posts...\n`)

  let migrated = 0
  let failed = 0

  for (const post of posts) {
    const slug = post.slug
    try {
      // Check if already exists
      const existing = await sanityWriteClient.fetch(`*[_type == "blogPost" && slug.current == $slug][0]._id`, { slug })
      if (existing) {
        console.log(`  Skipped (exists): ${post.title}`)
        continue
      }

      // Parse categories for this post
      const postCategories = post.category
        ? post.category.split(/[,;]/).map(c => c.trim()).filter(Boolean)
        : []
      const categoryRef = postCategories.length > 0 && categoryRefs[postCategories[0]]
        ? categoryRefs[postCategories[0]]
        : undefined

      // Parse tags for this post
      const postTags = (post.tags || [])
        .filter(t => tagRefs[t.trim()])
        .map(t => tagRefs[t.trim()])

      // Convert content: strip HTML garbage, convert to Portable Text
      let content = []
      const isHtmlGarbage = post.content?.includes('<!DOCTYPE html>') || post.content?.startsWith('<')

      if (isHtmlGarbage) {
        // Extract text from between HTML tags for garbage content
        const textMatches = post.content?.match(/>([^<]{10,})</g) || []
        const extractedText = textMatches
          .map(m => m.replace(/[><]/g, '').trim())
          .filter(t => t.length > 20 && !t.includes('data-ff-'))
          .join('\n\n')

        if (extractedText.length > 100) {
          content = textToPortableText(extractedText.slice(0, 5000))
        } else {
          // Fallback: use excerpt as content
          content = textToPortableText(post.excerpt || post.title)
        }
      } else {
        // Clean HTML/richtext content
        const stripped = post.content
          ?.replace(/<[^>]+>/g, ' ')
          ?.replace(/\s+/g, ' ')
          ?.trim()
        content = textToPortableText(stripped || post.excerpt || post.title)
      }

      const doc = await sanityWriteClient.create({
        _type: 'blogPost',
        title: post.title,
        slug: { _type: 'slug', current: slug },
        excerpt: post.excerpt || '',
        content,
        status: 'published',
        publishedAt: post.published_at,
        category: categoryRef,
        tags: postTags,
        metaTitle: post.meta_title || post.title.slice(0, 60),
        metaDescription: post.meta_description || post.excerpt?.slice(0, 160) || '',
        readingTime: post.reading_time || 5,
        author: 'Cosmic Spirit Guide',
      })

      migrated++
      console.log(`  ✓ Migrated: ${post.title} (${doc._id})`)
    } catch (err) {
      failed++
      console.error(`  ✗ Failed: ${post.title} — ${err.message}`)
    }
  }

  console.log(`\n=== Migration Complete ===`)
  console.log(`  Migrated: ${migrated}`)
  console.log(`  Failed:   ${failed}`)
  console.log(`  Total:    ${posts.length}`)

  await pool.end()
}

migrate().catch(err => {
  console.error('Migration crashed:', err)
  process.exit(1)
})
