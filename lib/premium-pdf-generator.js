/**
 * Premium PDF Generator
 * Generates e-book quality PDFs using React component + Puppeteer
 * Uses "Stitch Strategy" - renders each section separately and merges with pdf-lib
 * 
 * NOTE: This is a server-only utility. Uses dynamic imports for React to avoid Next.js build issues.
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

/**
 * Generate premium PDF from user data using Stitch Strategy
 * Each section is rendered separately and merged together
 * @param {Object} userData - User data object
 * @returns {Promise<Buffer>} PDF buffer
 */
export async function generatePremiumPdf(userData) {
    // Handle background image: support Cloudinary URLs, base64, or fallback to default
  if (!userData.base64BackgroundImage && !userData.backgroundImageUrl) {
    // Default Cloudinary cover image (mystical cosmic design)
    const defaultCloudinaryUrl = process.env.DEFAULT_COVER_IMAGE_URL || 
                                 'https://res.cloudinary.com/dfgthvwaa/image/upload/v1766069741/Reportcsgmaster_ivw9cl.png';
    
    // Use Cloudinary URL as default instead of local file
    userData.base64BackgroundImage = defaultCloudinaryUrl;
    console.log('[Premium PDF Generator] Using default Cloudinary cover image:', defaultCloudinaryUrl);
    
    // Fallback: Try local file if Cloudinary URL fails (for offline/dev)
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const possiblePaths = [
        path.join(process.cwd(), 'docs', 'Nebula.jpg'),
        path.join(process.cwd(), 'csg', 'docs', 'Nebula.jpg'),
        path.join(process.cwd(), '..', 'docs', 'Nebula.jpg'),
        path.join(process.cwd(), '..', '..', 'docs', 'Nebula.jpg'),
      ];
      
      let bgPath = null;
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          bgPath = testPath;
          console.log('[Premium PDF Generator] Found local fallback background image at:', bgPath);
          // Only use local file if Cloudinary URL is not set via env var
          if (!process.env.DEFAULT_COVER_IMAGE_URL) {
            const base64 = fs.readFileSync(bgPath).toString('base64');
            userData.base64BackgroundImage = `data:image/jpeg;base64,${base64}`;
            console.log('[Premium PDF Generator] Using local fallback background image');
          }
          break;
        }
      }
    } catch (err) {
      console.warn('[Premium PDF Generator] Could not load local fallback, using Cloudinary default');
    }
  } else {
    // Support both base64BackgroundImage and backgroundImageUrl (Cloudinary URL)
    if (userData.backgroundImageUrl) {
      // Cloudinary URL provided - use it directly (Puppeteer will fetch it)
      userData.base64BackgroundImage = userData.backgroundImageUrl;
      console.log('[Premium PDF Generator] Using Cloudinary background image URL:', userData.backgroundImageUrl.substring(0, 50) + '...');
    } else if (userData.base64BackgroundImage) {
      console.log('[Premium PDF Generator] Using provided background image (base64 or data URL)');
    }
  }
  

  // Dynamically import React and ReactDOMServer to avoid Next.js build restrictions
  const React = await import('react');
  const ReactDOMServer = await import('react-dom/server');
  
  // Dynamically import the MasterReport component (avoid SSR issues)
  const { default: MasterReport } = await import('@/components/pdf/MasterReport');
  
  // Read CSS file
  const cssPath = path.join(process.cwd(), 'styles', 'PrintReport.css');
  const cssContent = fs.existsSync(cssPath)
    ? fs.readFileSync(cssPath, 'utf-8')
    : '/* CSS file not found */';

  // Helper function to wrap HTML with full document structure
  const wrapHtml = (htmlContent, title = 'Master Report') => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${userData.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Lora:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
  <style>
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `;
  };

  // Define sections to render individually (STITCH STRATEGY)
  // Each section will be rendered separately and merged together
  const sections = [
    { name: 'cover', label: 'Cover Page', hasBackground: true, type: 'html' },
    { name: 'birth_chart', label: 'Birth Chart', hasBackground: false, type: 'chart' }, // Special handling: landscape with embedded image
    { name: 'core_identity', label: 'Core Identity', hasBackground: false, type: 'html' },
    { name: 'planetary_analysis', label: 'Planetary Analysis', hasBackground: false, type: 'html' },
    { name: 'relationship_matrix', label: 'Relationship Matrix', hasBackground: false, type: 'html' },
    { name: 'compatibility', label: 'Compatibility Analysis', hasBackground: false, type: 'html' },
    { name: 'transit', label: 'Transit Forecast', hasBackground: false, type: 'html' },
    { name: 'annual', label: 'Annual Forecast', hasBackground: false, type: 'html' },
    { name: 'karmic', label: 'Karmic Work', hasBackground: false, type: 'html' },
    { name: 'closing', label: 'Closing Blessing', hasBackground: false, type: 'html' },
  ];

  // Configure Puppeteer for Render.com/Lambda
  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  // Use Chromium executable path if available (for production/Render.com)
  if (chromium) {
    try {
      if (typeof chromium.setGraphicsMode === 'function') {
        chromium.setGraphicsMode(false);
      }
      
      let executablePath;
      if (typeof chromium.executablePath === 'function') {
        executablePath = await chromium.executablePath();
      } else if (chromium.executablePath) {
        executablePath = chromium.executablePath;
      } else if (chromium.default?.executablePath) {
        executablePath = typeof chromium.default.executablePath === 'function'
          ? await chromium.default.executablePath()
          : chromium.default.executablePath;
      }
      
      if (executablePath) {
        launchOptions.executablePath = executablePath;
        launchOptions.args = chromium.args || launchOptions.args;
        launchOptions.defaultViewport = chromium.defaultViewport || { width: 1280, height: 720 };
        launchOptions.headless = chromium.headless !== false;
      }
    } catch (error) {
      console.warn('[Premium PDF Generator] Chromium executablePath failed, using system Chrome:', error);
    }
  }

  // Dynamically import pdf-lib (avoid bundling issues)
  const { PDFDocument } = await import('pdf-lib');
  
  // Create merged PDF document
  const mergedPdf = await PDFDocument.create();

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();
    
    // Set longer default timeout for all operations
    page.setDefaultNavigationTimeout(60000); // 60 seconds
    page.setDefaultTimeout(60000);

    // Set A4 viewport
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
    });

    // STITCH STRATEGY: Render each section individually and merge
    console.log('[Premium PDF Generator] Starting Stitch Strategy - rendering sections individually');
    
    for (const section of sections) {
      try {
        console.log(`[Premium PDF Generator] Rendering section: ${section.label}`);
        
        // HYBRID LAYOUT: Special handling for Birth Chart (landscape with embedded image)
        if (section.type === 'chart' && section.name === 'birth_chart') {
          // Priority 1: Check userData.chartImageBase64 directly (as specified by user)
          let chartImageData = null;
          let chartImageFormat = null;
          
          if (userData.chartImageBase64) {
            const imgData = userData.chartImageBase64;
            if (typeof imgData === 'string') {
              if (imgData.startsWith('data:image/png')) {
                chartImageData = imgData.split(',')[1];
                chartImageFormat = 'png';
              } else if (imgData.startsWith('data:image/jpeg') || imgData.startsWith('data:image/jpg')) {
                chartImageData = imgData.split(',')[1];
                chartImageFormat = 'jpg';
              } else if (imgData.startsWith('data:image')) {
                // Generic image data URL - try to detect format
                chartImageData = imgData.split(',')[1];
                chartImageFormat = imgData.includes('png') ? 'png' : 
                                  (imgData.includes('jpeg') || imgData.includes('jpg')) ? 'jpg' : 'png';
              } else {
                // Raw base64 string (assume PNG)
                chartImageData = imgData;
                chartImageFormat = 'png';
              }
            }
          }
          
          // Priority 2: Check sections for chartImage
          if (!chartImageData && userData.sections) {
            const birthChartSection = userData.sections.find(s => s.type === 'birth_chart');
            if (birthChartSection?.chartImage) {
              if (birthChartSection.chartImage.startsWith('data:image/png')) {
                chartImageData = birthChartSection.chartImage.split(',')[1];
                chartImageFormat = 'png';
              } else if (birthChartSection.chartImage.startsWith('data:image/jpeg') || birthChartSection.chartImage.startsWith('data:image/jpg')) {
                chartImageData = birthChartSection.chartImage.split(',')[1];
                chartImageFormat = 'jpg';
              } else if (birthChartSection.chartImage.startsWith('data:image/svg+xml')) {
                // For SVG, we'll render it via HTML/Puppeteer but in landscape
                chartImageData = birthChartSection.chartImage;
                chartImageFormat = 'svg';
              }
            }
          }
          
          // Priority 3: Fallback to birthChartImageBase64
          if (!chartImageData && userData.birthChartImageBase64) {
            const imgData = userData.birthChartImageBase64;
            if (typeof imgData === 'string') {
              if (imgData.startsWith('data:image')) {
                chartImageData = imgData.split(',')[1];
                chartImageFormat = imgData.includes('png') ? 'png' : 
                                  (imgData.includes('jpeg') || imgData.includes('jpg')) ? 'jpg' : 'png';
              } else {
                chartImageData = imgData;
                chartImageFormat = 'png';
              }
            }
          }
          
          // If we have image data, create landscape page and embed it
          if (chartImageData && (chartImageFormat === 'png' || chartImageFormat === 'jpg')) {
            console.log(`[Premium PDF Generator] Embedding ${chartImageFormat.toUpperCase()} chart image in landscape page`);
            
            // Create a new landscape page (A4 Landscape: 842 x 595 points)
            const landscapePage = mergedPdf.addPage([842, 595]); // Width x Height in points (A4 Landscape)
            
            // Decode base64 image data
            const imageBytes = Buffer.from(chartImageData, 'base64');
            
            // Embed the image
            let embeddedImage;
            if (chartImageFormat === 'png') {
              embeddedImage = await mergedPdf.embedPng(imageBytes);
            } else {
              embeddedImage = await mergedPdf.embedJpg(imageBytes);
            }
            
            // Calculate scaling to fit page with padding (e.g., 20mm = ~57 points on each side)
            const padding = 57; // 20mm in points
            const maxWidth = 842 - (padding * 2); // Page width minus padding
            const maxHeight = 595 - (padding * 2); // Page height minus padding
            
            const imageDims = embeddedImage.scale(1);
            const scaleX = maxWidth / imageDims.width;
            const scaleY = maxHeight / imageDims.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
            
            const scaledWidth = imageDims.width * scale;
            const scaledHeight = imageDims.height * scale;
            
            // Center the image on the page
            const x = (842 - scaledWidth) / 2;
            const y = (595 - scaledHeight) / 2;
            
            // Draw the image
            landscapePage.drawImage(embeddedImage, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight,
            });
            
            console.log(`[Premium PDF Generator] ✓ ${section.label} - added 1 landscape page with embedded image`);
            continue;
          } else if (chartImageFormat === 'svg' || userData.birthChartSvg) {
            // For SVG, render via HTML but in landscape orientation
            console.log(`[Premium PDF Generator] Rendering SVG chart in landscape via HTML`);
            
            const sectionComponent = React.createElement(MasterReport, { 
              userData, 
              renderSection: section.name 
            });
            const sectionHtml = ReactDOMServer.renderToStaticMarkup(sectionComponent);
            
            if (!sectionHtml || sectionHtml.trim().length < 100) {
              console.log(`[Premium PDF Generator] Skipping ${section.label} - no SVG content`);
              continue;
            }
            
            const fullSectionHtml = wrapHtml(sectionHtml, section.label);
            
            // Set landscape viewport (A4 Landscape: 1123 x 794 pixels at 96 DPI)
            await page.setViewport({
              width: 1123, // A4 height in pixels (landscape)
              height: 794, // A4 width in pixels (landscape)
            });
            
            await page.setContent(fullSectionHtml, { 
              waitUntil: 'load',
              timeout: 60000
            });
            
            // Wait for SVG to render and ensure it's properly sized
            await page.evaluate(() => {
              const svg = document.querySelector('svg');
              if (svg) {
                // Ensure SVG fits within viewport
                svg.style.maxWidth = '100%';
                svg.style.height = 'auto';
                svg.style.display = 'block';
                svg.style.margin = '0 auto';
              }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Generate landscape PDF with zero margins for full bleed
            const sectionBuffer = await page.pdf({
              format: 'A4',
              landscape: true, // Landscape orientation
              printBackground: true,
              displayHeaderFooter: false,
              margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm',
              },
              preferCSSPageSize: false,
            });
            
            // Reset viewport for next section (portrait)
            await page.setViewport({
              width: 794,
              height: 1123,
            });
            
            const sectionDoc = await PDFDocument.load(sectionBuffer);
            const pageIndices = sectionDoc.getPageIndices();
            const copiedPages = await mergedPdf.copyPages(sectionDoc, pageIndices);
            
            copiedPages.forEach((copiedPage) => {
              mergedPdf.addPage(copiedPage);
            });
            
            console.log(`[Premium PDF Generator] ✓ ${section.label} - added ${pageIndices.length} landscape page(s)`);
            continue;
          } else {
            console.log(`[Premium PDF Generator] No chart image found for ${section.label}, skipping`);
            continue;
          }
        }
        
        // STANDARD HTML RENDERING for all other sections
        let sectionHtml = null;
        let fullSectionHtml = null;
        
        // 1. Render just this single section component to HTML
        const sectionComponent = React.createElement(MasterReport, { 
          userData, 
          renderSection: section.name 
        });
        sectionHtml = ReactDOMServer.renderToStaticMarkup(sectionComponent);
        
        // Skip if section rendered empty (e.g., section doesn't exist in data)
        // Check for actual content, not just wrapper divs
        const hasContent = sectionHtml && (
          sectionHtml.includes('<h1') || 
          sectionHtml.includes('<h2') || 
          sectionHtml.includes('<p>') ||
          sectionHtml.includes('<svg') ||
          sectionHtml.includes('<table') ||
          sectionHtml.trim().length > 200
        );
        
        if (!hasContent) {
          console.log(`[Premium PDF Generator] Skipping ${section.label} - no content (HTML length: ${sectionHtml?.length || 0})`);
          continue;
        }
        
        // 2. Wrap HTML with full document structure
        fullSectionHtml = wrapHtml(sectionHtml, section.label);
        
        // 3. Set content on the Puppeteer page with increased timeout
        // Use 'load' instead of 'networkidle0' for faster rendering (networkidle0 waits for 500ms of no network activity)
        try {
          await page.setContent(fullSectionHtml, { 
            waitUntil: 'load', // Faster than networkidle0
            timeout: 60000 // Increase timeout to 60 seconds for complex sections
          });
        } catch (loadError) {
          // Fallback to domcontentloaded if load fails
          console.log(`[Premium PDF Generator] Load wait failed, trying domcontentloaded for ${section.label}...`);
          await page.setContent(fullSectionHtml, { 
            waitUntil: 'domcontentloaded',
            timeout: 60000
          });
        }
        
        // 4. Wait for fonts to load (but don't block if fonts fail)
        try {
          await page.evaluateHandle('document.fonts.ready');
        } catch (fontError) {
          console.warn(`[Premium PDF Generator] Font loading warning for ${section.label}:`, fontError.message);
        }
        // Additional wait to ensure rendering is complete
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 5. Generate a PDF buffer for JUST this section
        const sectionBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: false,
          margin: {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm',
          },
          preferCSSPageSize: false,
        });
        
        // 6. Load this buffer into pdf-lib and copy pages to merged PDF
        const sectionDoc = await PDFDocument.load(sectionBuffer);
        const pageIndices = sectionDoc.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(sectionDoc, pageIndices);
        
        // 7. Add each page to the merged PDF
        copiedPages.forEach((copiedPage) => {
          mergedPdf.addPage(copiedPage);
        });
        
        console.log(`[Premium PDF Generator] ✓ ${section.label} - added ${pageIndices.length} page(s)`);
      } catch (sectionError) {
        console.error(`[Premium PDF Generator] Error rendering section ${section.label}:`, sectionError.message || sectionError);
        
        // If it's a timeout error and we have the HTML, try with a simpler wait condition
        if ((sectionError.name === 'TimeoutError' || sectionError.message?.includes('timeout')) && fullSectionHtml) {
          console.log(`[Premium PDF Generator] Retrying ${section.label} with simpler wait condition...`);
          try {
            // Retry with domcontentloaded and shorter timeout
            await page.setContent(fullSectionHtml, { 
              waitUntil: 'domcontentloaded',
              timeout: 45000
            });
            // Shorter wait for retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const sectionBuffer = await page.pdf({
              format: 'A4',
              printBackground: true,
              displayHeaderFooter: false,
              margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm',
              },
              preferCSSPageSize: false,
            });
            
            const sectionDoc = await PDFDocument.load(sectionBuffer);
            const pageIndices = sectionDoc.getPageIndices();
            const copiedPages = await mergedPdf.copyPages(sectionDoc, pageIndices);
            copiedPages.forEach((copiedPage) => {
              mergedPdf.addPage(copiedPage);
            });
            
            console.log(`[Premium PDF Generator] ✓ ${section.label} - added ${pageIndices.length} page(s) (retry succeeded)`);
            continue;
          } catch (retryError) {
            console.error(`[Premium PDF Generator] Retry failed for ${section.label}:`, retryError.message || retryError);
            // Continue with next section instead of failing completely
            continue;
          }
        }
        
        // Continue with next section instead of failing completely
        continue;
      }
    }

    await browser.close();
    
    // 8. Return the combined PDF as Buffer
    console.log('[Premium PDF Generator] Merging all sections into final PDF...');
    const finalPdfBytes = await mergedPdf.save();
    const finalBuffer = Buffer.from(finalPdfBytes);
    
    console.log(`[Premium PDF Generator] ✓ PDF generation complete - ${finalBuffer.length} bytes`);
    return finalBuffer;
  } catch (error) {
    await browser.close();
    throw error;
  }
}





