const logger = require('./logger');
import { v2 as cloudinary } from 'cloudinary';

// Support both CLOUDINARY_URL (single environment variable) and individual credentials
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Log configuration (without exposing secrets)
logger.info('Cloudinary configured:', {
  usingURL: !!process.env.CLOUDINARY_URL,
  cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'FROM_URL',
  apiKey: process.env.CLOUDINARY_API_KEY ? 'SET' : process.env.CLOUDINARY_URL ? 'FROM_URL' : 'NOT SET',
});

// Export the configured cloudinary instance for downstream modules (PDF uploads, etc.)
export { cloudinary };

/**
 * Upload image to Cloudinary
 * @param {Buffer} buffer - Image buffer
 * @param {string} folder - Folder path in Cloudinary (e.g., 'blog')
 * @param {number} maxWidth - Max width for optimization (default: 1920)
 * @returns {Promise<string>} - Cloudinary URL
 */
export async function uploadImage(buffer, folder = 'blog', maxWidth = 1920) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        transformation: [
          { width: maxWidth, quality: 'auto', fetch_format: 'auto' }
        ],
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
    
    uploadStream.end(buffer);
  });
}

/**
 * Delete image from Cloudinary
 * @param {string} url - Cloudinary URL or public ID
 * @returns {Promise<void>}
 */
export async function deleteImage(url) {
  const publicId = extractPublicId(url);
  if (publicId) {
    await cloudinary.uploader.destroy(publicId);
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null}
 */
function extractPublicId(url) {
  if (!url) return null;
  const match = url.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)/);
  return match ? match[1] : null;
}

