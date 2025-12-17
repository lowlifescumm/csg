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
    // Ensure background image is set (fallback to docs/Nebula.jpg if missing)
  if (!userData.base64BackgroundImage) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Try multiple possible paths (for different deployment environments)
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
          console.log('[Premium PDF Generator] Found background image at:', bgPath);
          break;
        }
      }
      
      if (bgPath) {
        const base64 = fs.readFileSync(bgPath).toString('base64');
        userData.base64BackgroundImage = `data:image/jpeg;base64,${base64}`;
        console.log('[Premium PDF Generator] Loaded default background image, size:', base64.length, 'chars');
      } else {
        console.warn('[Premium PDF Generator] Background image not found in any of these paths:', possiblePaths);
      }
    } catch (err) {
      console.error('[Premium PDF Generator] Error loading default background image:', err);
    }
  } else {
    console.log('[Premium PDF Generator] Using provided background image');
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
    { name: 'cover', label: 'Cover Page', hasBackground: true },
    { name: 'birth_chart', label: 'Birth Chart', hasBackground: false },
    { name: 'core_identity', label: 'Core Identity', hasBackground: false },
    { name: 'planetary_analysis', label: 'Planetary Analysis', hasBackground: false },
    { name: 'relationship_matrix', label: 'Relationship Matrix', hasBackground: false },
    { name: 'compatibility', label: 'Compatibility Analysis', hasBackground: false },
    { name: 'transit', label: 'Transit Forecast', hasBackground: false },
    { name: 'annual', label: 'Annual Forecast', hasBackground: false },
    { name: 'karmic', label: 'Karmic Work', hasBackground: false },
    { name: 'closing', label: 'Closing Blessing', hasBackground: false },
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
        
        // 1. Render just this single section component to HTML
        const sectionComponent = React.createElement(MasterReport, { 
          userData, 
          renderSection: section.name 
        });
        const sectionHtml = ReactDOMServer.renderToStaticMarkup(sectionComponent);
        
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
        const fullSectionHtml = wrapHtml(sectionHtml, section.label);
        
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
        
        // If it's a timeout error, try with a simpler wait condition
        if (sectionError.name === 'TimeoutError' || sectionError.message?.includes('timeout')) {
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





