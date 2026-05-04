import { createClient } from '@sanity/client'

// Sanity client for WRITING content (pipeline, admin)
// Requires SANITY_WRITE_TOKEN with Editor rights
export const sanityWriteClient = createClient({
  projectId: 'kicslgfz',
  dataset: 'production',
  apiVersion: '2024-05-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false, // must use live API for writes
})

// Upload image to Sanity assets
export async function uploadImageToSanity(imageUrl, filename = 'image.jpg') {
  if (!imageUrl) return null
  
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`)
    
    const buffer = await res.arrayBuffer()
    const asset = await sanityWriteClient.assets.upload('image', Buffer.from(buffer), {
      filename,
      contentType: 'image/jpeg',
    })
    
    return {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: asset._id,
      },
    }
  } catch (err) {
    console.error('Sanity image upload failed:', err.message)
    return null
  }
}

// Convert plain text to Portable Text blocks
export function textToPortableText(text) {
  if (!text) return []
  
  // Split by double newlines to create paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
  
  return paragraphs.map(p => ({
    _type: 'block',
    _key: Math.random().toString(36).slice(2),
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(36).slice(2),
        text: p.trim(),
        marks: [],
      },
    ],
  }))
}
