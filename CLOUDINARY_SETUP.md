# Cloudinary Image Upload Setup Guide

## ✅ Implementation Complete!

Image upload functionality has been successfully integrated into your blog admin system using Cloudinary.

## 📋 What Was Implemented

### Files Created/Modified:
1. ✅ `lib/cloudinary.js` - Utility for uploading/deleting images
2. ✅ `app/api/upload/image/route.js` - Upload API endpoint (admin-only)
3. ✅ `app/admin/blog/new/page.js` - Upload UI for new posts
4. ✅ `app/admin/blog/[id]/edit/page.js` - Upload UI for editing posts
5. ✅ `env.template` - Added Cloudinary environment variables
6. ✅ `render.yaml` - Added Cloudinary environment variables
7. ✅ `package.json` - Added cloudinary dependency

## 🚀 Setup Instructions

### Step 1: Get Your Cloudinary Credentials

1. Go to https://cloudinary.com/console
2. Log in to your account
3. On the Dashboard, you'll see **API Environment Variable**:
   - **CLOUDINARY_URL** (e.g., `cloudinary://219747475232121:**********@dfgthvwaa`)

   Or individual credentials:
   - **Cloud Name** (e.g., `dfgthvwaa`)
   - **API Key** (e.g., `219747475232121`)
   - **API Secret** (masked)

### Step 2: Add Environment Variables

#### For Local Development (.env.local):

Open `csg/.env.local` and add **ONE** of these options:

**Option 1: Use CLOUDINARY_URL (Recommended)**
```bash
# Cloudinary Image Storage
CLOUDINARY_URL=cloudinary://219747475232121:your-api-secret@dfgthvwaa
```

**Option 2: Use individual credentials**
```bash
# Cloudinary Image Storage
CLOUDINARY_CLOUD_NAME=dfgthvwaa
CLOUDINARY_API_KEY=219747475232121
CLOUDINARY_API_SECRET=your-api-secret
```

Replace the placeholder values with your actual credentials.

#### For Production (Render):

1. Go to your Render Dashboard: https://dashboard.render.com
2. Select your **cosmic-spiritual-guide** service
3. Click on **Environment** in the left sidebar
4. Click **Add Environment Variable**
5. Add the **CLOUDINARY_URL** variable:
   - **Key**: `CLOUDINARY_URL`
   - **Value**: `cloudinary://your-api-key:your-api-secret@your-cloud-name`
6. Click **Save Changes**
7. Render will automatically redeploy with the new variables

### Step 3: Test Locally

1. Make sure your `.env.local` has the Cloudinary credentials
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Visit http://localhost:5000/admin/blog
4. Create a new post or edit an existing one
5. Try uploading an image:
   - Click the "Click to upload image" button
   - Select an image file (max 10MB)
   - You should see "Uploading..." then the image preview
6. Save your post and verify the image appears on the blog

## 🎨 Features

### What You Can Do:
- ✅ **Upload Images**: Drag & drop or click to select
- ✅ **Automatic Optimization**: Images automatically resized to max 1920px width
- ✅ **Format Conversion**: Cloudinary converts to WebP when beneficial
- ✅ **Quality Optimization**: Automatic quality adjustment
- ✅ **Manual URLs**: Still support pasting external image URLs
- ✅ **Image Preview**: See uploaded images before saving
- ✅ **File Validation**: Only allows images (JPEG, PNG, WebP, GIF)
- ✅ **Size Limits**: Maximum 10MB per file
- ✅ **Admin Only**: Only admins can upload images
- ✅ **Secure**: Images stored in Cloudinary cloud storage
- ✅ **CDN**: Images served via Cloudinary's global CDN

### File Organization:
Images are uploaded to the `blog/` folder in your Cloudinary account, making them easy to organize and manage.

## 🔒 Security

- ✅ Admin authentication required
- ✅ File type validation
- ✅ File size limits (10MB)
- ✅ Server-side validation
- ✅ Secure API keys stored in environment variables

## 💰 Cloudinary Pricing

You're on the **Free Tier** which includes:
- ✅ 25 GB storage
- ✅ 25 GB monthly bandwidth
- ✅ Unlimited transformations
- ✅ Fast CDN delivery

This should be plenty for your blog! If you need more, paid plans start at $89/month.

## 🐛 Troubleshooting

### "Failed to upload image"
- Check your Cloudinary credentials are correct
- Verify all three environment variables are set
- Check browser console for detailed error messages
- Ensure you're logged in as admin

### "Invalid file type"
- Only JPEG, JPG, PNG, WebP, and GIF are allowed
- Check your file extension

### "File too large"
- Maximum file size is 10MB
- Use an image editor to compress before uploading

### Images not showing on production
- Verify Cloudinary credentials are set in Render
- Check Render logs for errors
- Redeploy if you just added environment variables

## 📝 Next Steps

After setup, you can:
1. Upload featured images for your blog posts
2. Organize images in Cloudinary dashboard
3. Use Cloudinary's transformations for different sizes
4. Monitor usage in Cloudinary dashboard

## 🎉 You're All Set!

Your blog now supports image uploads! Just add your Cloudinary credentials and you're ready to go.

