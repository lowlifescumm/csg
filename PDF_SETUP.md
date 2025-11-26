# PDF Generation Setup Guide

## Overview

PDF generation on Render requires an external API service since Chrome/Chromium is not available in the Render environment by default.

## Option 1: Use External PDF API Service (Recommended for Render)

### Free Services:
1. **html2pdf.app** - Free tier available
   - Sign up at https://html2pdf.app
   - Get your API key
   - Set environment variables:
     ```
     PDF_API_URL=https://api.html2pdf.app/v1/generate
     PDF_API_KEY=your-api-key-here
     ```

2. **PDFShift** - Free tier: 500 PDFs/month
   - Sign up at https://pdfshift.io
   - Get your API key
   - Set environment variables:
     ```
     PDF_API_URL=https://api.pdfshift.io/v3/convert/pdf
     PDF_API_KEY=your-api-key-here
     ```

3. **HTMLtoPDF API** - Free tier available
   - Sign up at https://htmltopdfapi.com
   - Get your API key
   - Set environment variables:
     ```
     PDF_API_URL=https://htmltopdfapi.com/api/v1/pdf
     PDF_API_KEY=your-api-key-here
     ```

### Setup Steps:
1. Sign up for one of the services above
2. Get your API key
3. Add to Render environment variables:
   - `PDF_API_URL` - The API endpoint URL
   - `PDF_API_KEY` - Your API key

## Option 2: Self-Hosted Solution (Advanced)

If you prefer not to use external services, you can:
1. Deploy a separate PDF generation service using Docker with Chrome
2. Use a service like Gotenberg (self-hosted)
3. Update `PDF_API_URL` to point to your self-hosted service

## Option 3: Local Development

For local development, the system will try to use Puppeteer with Chrome if available. Install Chrome locally and it will work automatically.

## Current Implementation

The PDF generator:
1. **First tries**: External PDF API (if `PDF_API_KEY` is set)
2. **Falls back to**: Puppeteer with Chrome (if available, for local dev)
3. **Final fallback**: Returns HTML only (users can still download HTML)

## Testing

After setting up the PDF API:
1. Go to `/admin/test-reports`
2. Generate a test report
3. The PDF should automatically download

## Troubleshooting

- **"PDF_API_KEY not configured"**: Set the `PDF_API_URL` and `PDF_API_KEY` environment variables in Render
- **"PDF API returned error"**: Check your API key and service status
- **PDFs not generating**: Check Render logs for detailed error messages


