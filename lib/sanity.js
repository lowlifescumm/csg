import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

// ─── Sanity client for READING content ──────────────────────────
// Uses CDN for fast reads. No token needed for public datasets.
export const sanityClient = createClient({
  projectId: 'kicslgfz',
  dataset: 'production',
  apiVersion: '2024-05-01',
  useCdn: true,
  token: process.env.SANITY_API_TOKEN || undefined,
})

export const builder = imageUrlBuilder(sanityClient)

export function urlFor(source) {
  return builder.image(source)
}

// Convert Sanity Portable Text → plain text (for excerpts/fallbacks)
export function portableTextToPlainText(blocks = []) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map(child => child.text).join('') || '')
    .join('\n\n')
}

// Convert Sanity Portable Text → HTML string
export function portableTextToHtml(blocks = []) {
  if (!Array.isArray(blocks)) return ''
  return blocks.map(block => {
    if (block._type === 'block') {
      const text = block.children?.map(child => child.text).join('') || ''
      const style = block.style || 'normal'
      if (style === 'h1') return `<h1>${text}</h1>`
      if (style === 'h2') return `<h2>${text}</h2>`
      if (style === 'h3') return `<h3>${text}</h3>`
      if (style === 'blockquote') return `<blockquote>${text}</blockquote>`
      if (style === 'normal') return `<p>${text}</p>`
      return `<p>${text}</p>`
    }
    if (block._type === 'image') {
      const url = urlFor(block).width(800).url()
      const alt = block.alt || ''
      const caption = block.caption ? `<figcaption>${block.caption}</figcaption>` : ''
      return `<figure><img src="${url}" alt="${alt}" loading="lazy" />${caption}</figure>`
    }
    return ''
  }).join('')
}
