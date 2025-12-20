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
  // #region agent log - Environment detection
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV,
    platform: process.platform,
    isProduction: process.env.NODE_ENV === 'production' || !!process.env.RENDER,
    RENDER: !!process.env.RENDER,
    cwd: process.cwd(),
    hasChromium: !!chromium,
    timestamp: Date.now(),
  };
  console.log('[Premium PDF Generator] Environment:', JSON.stringify(envInfo, null, 2));
  // #endregion
  
  // Handle background image: support Cloudinary URLs, base64, or fallback to default
  if (!userData.base64BackgroundImage && !userData.backgroundImageUrl) {
    // Default Cloudinary cover image (mystical cosmic nebula design)
    const defaultCloudinaryUrl = process.env.DEFAULT_COVER_IMAGE_URL || 
                                 'https://res.cloudinary.com/dfgthvwaa/image/upload/v1765966699/Nebula_rqys3j.jpg';
    
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

  // Read CSS file - handle both dev and production paths
  // In Next.js standalone builds, files are in .next/standalone/
  // In dev, files are in project root
  const possibleCssPaths = [
    path.join(process.cwd(), 'styles', 'PrintReport.css'),
    path.join(process.cwd(), 'csg', 'styles', 'PrintReport.css'),
    path.join(process.cwd(), '.next', 'standalone', 'styles', 'PrintReport.css'),
    path.join(process.cwd(), '.next', 'standalone', 'csg', 'styles', 'PrintReport.css'),
    path.join(__dirname, '..', '..', 'styles', 'PrintReport.css'),
    path.join(__dirname, '..', 'styles', 'PrintReport.css'),
  ];
  
  let cssPath = null;
  let cssContent = '/* CSS file not found */';
  
  for (const testPath of possibleCssPaths) {
    if (fs.existsSync(testPath)) {
      cssPath = testPath;
      cssContent = fs.readFileSync(testPath, 'utf-8');
      break;
    }
  }
  
  // #region agent log - CSS loading
  console.log('[Premium PDF Generator] CSS file:', {
    cwd: process.cwd(),
    __dirname: __dirname,
    testedPaths: possibleCssPaths,
    foundPath: cssPath,
    exists: !!cssPath,
    contentLength: cssContent.length,
    hasPrintStyles: cssContent.includes('@media print'),
    hasCoverStyles: cssContent.includes('.cover-page'),
    nodeEnv: process.env.NODE_ENV,
    render: !!process.env.RENDER,
  });
  // #endregion

  // Helper function to wrap HTML with full document structure
  const wrapHtml = (htmlContent, title = 'Master Report') => {
    const fontsUrl = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Lora:ital,wght@0,400;0,700;1,400;1,700&display=swap';
    
    // #region agent log - HTML wrapper
    console.log('[Premium PDF Generator] Wrapping HTML:', {
      title,
      htmlLength: htmlContent.length,
      fontsUrl,
      cssLength: cssContent.length,
      hasSvg: htmlContent.includes('<svg'),
    });
    // #endregion
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${userData.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsUrl}" rel="stylesheet">
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

  // Detect platform
  const isWindows = process.platform === 'win32';
  const isLinux = process.platform === 'linux';
  const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER;

  // Use Chromium executable path if available (for production/Render.com/Linux)
  // On Windows dev, skip @sparticuz/chromium and use system Chrome instead
  if (chromium && (isLinux || isProduction)) {
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
      
      if (executablePath && fs.existsSync(executablePath)) {
        launchOptions.executablePath = executablePath;
        launchOptions.args = chromium.args || launchOptions.args;
        launchOptions.defaultViewport = chromium.defaultViewport || { width: 1280, height: 720 };
        launchOptions.headless = chromium.headless !== false;
      }
    } catch (error) {
      console.warn('[Premium PDF Generator] Chromium executablePath failed, using system Chrome:', error);
    }
  }

  // On Windows (dev only, not production), find system Chrome/Chromium
  if (isWindows && !isProduction && !launchOptions.executablePath) {
    const windowsChromePaths = [
      process.env.PUPPETEER_EXECUTABLE_PATH,
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
      process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
    ].filter(Boolean);

    for (const chromePath of windowsChromePaths) {
      if (fs.existsSync(chromePath)) {
        launchOptions.executablePath = chromePath;
        // Remove Linux-specific args on Windows
        launchOptions.args = ['--no-sandbox'];
        console.log('[Premium PDF Generator] Using Windows Chrome:', chromePath);
        break;
      }
    }

    // If no Chrome found, try puppeteer.executablePath() as fallback
    if (!launchOptions.executablePath) {
      try {
        const puppeteerExecutablePath = puppeteer.executablePath();
        if (puppeteerExecutablePath && fs.existsSync(puppeteerExecutablePath)) {
          launchOptions.executablePath = puppeteerExecutablePath;
          console.log('[Premium PDF Generator] Using puppeteer.executablePath():', puppeteerExecutablePath);
        } else {
          console.warn('[Premium PDF Generator] No Chrome found. Set PUPPETEER_EXECUTABLE_PATH env var or install Chrome.');
        }
      } catch (exePathError) {
        console.warn('[Premium PDF Generator] puppeteer.executablePath() failed:', exePathError.message);
      }
    }
  }

  // Dynamically import pdf-lib (avoid bundling issues)
  let PDFDocument;
  try {
    const pdfLib = await import('pdf-lib');
    PDFDocument = pdfLib.PDFDocument;
  } catch (pdfLibError) {
    throw pdfLibError;
  }
  
  // Create merged PDF document
  const mergedPdf = await PDFDocument.create();

  // Launch browser
  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
    
    // #region agent log - Browser info
    const browserVersion = await browser.version().catch(() => 'unknown');
    console.log('[Premium PDF Generator] Browser launched:', {
      version: browserVersion,
      executablePath: launchOptions.executablePath || 'default',
      headless: launchOptions.headless,
      args: launchOptions.args,
      platform: process.platform,
    });
    // #endregion
  } catch (launchError) {
    console.error('[Premium PDF Generator] Browser launch failed:', {
      error: launchError.message,
      stack: launchError.stack,
      executablePath: launchOptions.executablePath,
      platform: process.platform,
    });
    throw launchError;
  }

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
    
    // #region agent log - Section rendering start
    console.log('[Premium PDF Generator] Sections to render:', {
      count: sections.length,
      sections: sections.map(s => ({ name: s.name, label: s.label, type: s.type })),
      userDataKeys: Object.keys(userData),
      hasSections: !!userData.sections,
      sectionsCount: userData.sections?.length || 0,
    });
    // #endregion
    
    for (const section of sections) {
      try {
        console.log(`[Premium PDF Generator] Rendering section: ${section.label}`);
        
        // #region agent log - Section details
        const sectionData = {
          name: section.name,
          label: section.label,
          type: section.type,
          hasUserData: !!userData,
          hasSectionData: !!userData.sections?.find(s => s.type === section.name),
        };
        console.log('[Premium PDF Generator] Section data:', sectionData);
        // #endregion
        
        // HYBRID LAYOUT: Special handling for Birth Chart (landscape with embedded image)
        if (section.type === 'chart' && section.name === 'birth_chart') {
          // PRIORITY: Look for PNG from birth chart page first (already perfectly sized)
          let chartImageData = null;
          let chartImageFormat = null;
          
          // Priority 1: Check sections for chartImage (from birth chart page - already perfectly sized)
          if (userData.sections) {
            const birthChartSection = userData.sections.find(s => s.type === 'birth_chart' || s.type === 'birth_chart');
            if (birthChartSection?.chartImage) {
              // Check for PNG first (preferred - already perfectly sized)
              if (birthChartSection.chartImage.startsWith('data:image/png')) {
                chartImageData = birthChartSection.chartImage.split(',')[1];
                chartImageFormat = 'png';
                console.log('[Premium PDF Generator] Found PNG chart image from birth chart section (perfectly sized)');
              } else if (birthChartSection.chartImage.startsWith('data:image/jpeg') || birthChartSection.chartImage.startsWith('data:image/jpg')) {
                chartImageData = birthChartSection.chartImage.split(',')[1];
                chartImageFormat = 'jpg';
                console.log('[Premium PDF Generator] Found JPG chart image from birth chart section');
              } else if (birthChartSection.chartImage.startsWith('data:image/svg+xml')) {
                // SVG fallback - will render via HTML/Puppeteer
                chartImageData = birthChartSection.chartImage;
                chartImageFormat = 'svg';
                console.log('[Premium PDF Generator] Found SVG chart image from birth chart section (will render via HTML)');
              }
            }
          }
          
          // Priority 2: Check userData.chartImageBase64 directly
          if (!chartImageData && userData.chartImageBase64) {
            const imgData = userData.chartImageBase64;
            if (typeof imgData === 'string') {
              if (imgData.startsWith('data:image/png')) {
                chartImageData = imgData.split(',')[1];
                chartImageFormat = 'png';
                console.log('[Premium PDF Generator] Found PNG chart image from chartImageBase64');
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
            
            // Check if the rendered HTML actually contains chart content
            const hasChartContent = sectionHtml && (
              sectionHtml.includes('<svg') || 
              sectionHtml.includes('birth-chart') ||
              sectionHtml.includes('chart-container') ||
              sectionHtml.trim().length > 500
            );
            
            if (!hasChartContent) {
              console.log(`[Premium PDF Generator] Skipping ${section.label} - no SVG/chart content found (HTML length: ${sectionHtml?.length || 0})`);
              continue;
            }
            
            const fullSectionHtml = wrapHtml(sectionHtml, section.label);
            
            // Set landscape viewport (A4 Landscape: 1123 x 794 pixels at 96 DPI)
            const viewportWidth = 1123;
            const viewportHeight = 794;
            const pdfPageWidth = 842; // A4 Landscape width in points
            const pdfPageHeight = 595; // A4 Landscape height in points
            
            await page.setViewport({
              width: viewportWidth, // A4 height in pixels (landscape)
              height: viewportHeight, // A4 width in pixels (landscape)
            });
            
            await page.setContent(fullSectionHtml, { 
              waitUntil: 'load',
              timeout: 60000
            });
            
            // Wait for SVG to render and ensure it's properly sized
            const svgDimensions = await page.evaluate(() => {
              const svg = document.querySelector('svg');
              const container = document.querySelector('.chart-container');
              const pageOnly = document.querySelector('.chart-page-only');
              const reportContainer = document.querySelector('.report-container');
              
              if (!svg) return { error: 'No SVG found' };
              
              // Get viewport dimensions FIRST
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;
              
              // Remove ALL constraints from containers - make them full viewport size
              if (reportContainer) {
                reportContainer.style.width = `${viewportWidth}px`;
                reportContainer.style.maxWidth = `${viewportWidth}px`;
                reportContainer.style.padding = '0';
                reportContainer.style.margin = '0';
                reportContainer.style.overflow = 'visible';
              }
              
              if (pageOnly) {
                pageOnly.style.width = `${viewportWidth}px`;
                pageOnly.style.maxWidth = `${viewportWidth}px`;
                pageOnly.style.padding = '0';
                pageOnly.style.margin = '0';
                pageOnly.style.overflow = 'visible';
                pageOnly.style.boxSizing = 'border-box';
              }
              
              if (container) {
                container.style.width = `${viewportWidth}px`;
                container.style.maxWidth = `${viewportWidth}px`;
                container.style.padding = '0';
                container.style.margin = '0';
                container.style.overflow = 'visible';
                container.style.boxSizing = 'border-box';
              }
              
              // Get SVG viewBox to calculate aspect ratio
              const viewBox = svg.getAttribute('viewBox');
              let svgAspectRatio = 1.4; // Default 1400/1000 (updated to match new viewBox)
              if (viewBox) {
                const [, , vw, vh] = viewBox.split(' ').map(Number);
                if (vw && vh) svgAspectRatio = vw / vh;
              }
              
              // Calculate maximum dimensions that fit the viewport
              // Use 90% of viewport to ensure it fits with generous margin (prevents cutoff)
              const usableWidth = viewportWidth * 0.90;
              const usableHeight = viewportHeight * 0.90;
              
              let maxWidth, maxHeight;
              if (svgAspectRatio > (usableWidth / usableHeight)) {
                // SVG is wider - constrain by width
                maxWidth = usableWidth;
                maxHeight = usableWidth / svgAspectRatio;
              } else {
                // SVG is taller - constrain by height
                maxHeight = usableHeight;
                maxWidth = usableHeight * svgAspectRatio;
              }
              
              // Additional safety: ensure we don't exceed viewport bounds
              maxWidth = Math.min(maxWidth, viewportWidth * 0.90);
              maxHeight = Math.min(maxHeight, viewportHeight * 0.90);
              
              // Apply sizing to SVG - use explicit pixel values
              svg.style.width = `${maxWidth}px`;
              svg.style.height = `${maxHeight}px`;
              svg.style.maxWidth = `${maxWidth}px`;
              svg.style.maxHeight = `${maxHeight}px`;
              svg.style.display = 'block';
              svg.style.margin = '0 auto';
              svg.style.boxSizing = 'border-box';
              svg.style.overflow = 'visible';
              
              // Force body/html to not constrain
              document.body.style.width = `${viewportWidth}px`;
              document.body.style.maxWidth = `${viewportWidth}px`;
              document.body.style.margin = '0';
              document.body.style.padding = '0';
              document.body.style.overflow = 'visible';
              
              if (document.documentElement) {
                document.documentElement.style.width = `${viewportWidth}px`;
                document.documentElement.style.maxWidth = `${viewportWidth}px`;
                document.documentElement.style.margin = '0';
                document.documentElement.style.padding = '0';
                document.documentElement.style.overflow = 'visible';
              }
              
              const svgRect = svg.getBoundingClientRect();
              const containerRect = container?.getBoundingClientRect();
              const pageOnlyRect = pageOnly?.getBoundingClientRect();
              const computedStyle = window.getComputedStyle(svg);
              
              return {
                svgWidth: svgRect.width,
                svgHeight: svgRect.height,
                svgViewBox: svg.getAttribute('viewBox'),
                svgAspectRatio,
                viewportAspectRatio: viewportWidth / viewportHeight,
                maxWidth,
                maxHeight,
                svgComputedWidth: computedStyle.width,
                svgComputedHeight: computedStyle.height,
                containerWidth: containerRect?.width,
                containerHeight: containerRect?.height,
                pageOnlyWidth: pageOnlyRect?.width,
                pageOnlyHeight: pageOnlyRect?.height,
                viewportWidth,
                viewportHeight,
              };
            });
            
            // Wait a bit more to ensure all styles are applied
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Verify SVG fits before generating PDF
            const finalCheck = await page.evaluate(() => {
              const svg = document.querySelector('svg');
              if (!svg) return { error: 'No SVG' };
              const rect = svg.getBoundingClientRect();
              return {
                svgWidth: rect.width,
                svgHeight: rect.height,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
                fitsWidth: rect.width <= window.innerWidth * 0.95,
                fitsHeight: rect.height <= window.innerHeight * 0.95,
              };
            });
            
            // Generate landscape PDF with zero margins for full bleed
            // Use explicit page dimensions to prevent splitting
            const sectionBuffer = await page.pdf({
              width: '1123px',  // Explicit width in pixels (A4 Landscape width at 96 DPI)
              height: '794px',   // Explicit height in pixels (A4 Landscape height at 96 DPI)
              landscape: true,
              printBackground: true,
              displayHeaderFooter: false,
              margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm',
              },
              preferCSSPageSize: false,
              scale: 1.0, // Ensure no scaling
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
            // No chart image found - skip this section entirely (don't create blank page)
            console.log(`[Premium PDF Generator] No chart image found for ${section.label}, skipping section entirely`);
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
        
        // #region agent log - HTML rendering
        console.log(`[Premium PDF Generator] Section HTML rendered for ${section.label}:`, {
          htmlLength: sectionHtml?.length || 0,
          hasContent: !!sectionHtml && sectionHtml.trim().length > 0,
          hasSvg: sectionHtml?.includes('<svg') || false,
          hasImages: sectionHtml?.includes('<img') || sectionHtml?.includes('background-image') || false,
          hasFonts: sectionHtml?.includes('Cinzel') || sectionHtml?.includes('Lora') || false,
        });
        // #endregion
        
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
        
        // #region agent log - Page content loading
        console.log(`[Premium PDF Generator] Loading page content for ${section.label}:`, {
          fullHtmlLength: fullSectionHtml.length,
          viewport: { width: 794, height: 1123 },
        });
        // #endregion
        
        // 3. Set content on the Puppeteer page with increased timeout
        // Use 'networkidle0' to ensure fonts and images are loaded
        try {
          await page.setContent(fullSectionHtml, { 
            waitUntil: 'networkidle0', // Wait for all network activity to finish (fonts, images, etc.)
            timeout: 60000 // Increase timeout to 60 seconds for complex sections
          });
        } catch (loadError) {
          // Fallback to 'load' if networkidle0 fails
          console.log(`[Premium PDF Generator] networkidle0 wait failed, trying 'load' for ${section.label}...`);
          try {
            await page.setContent(fullSectionHtml, { 
              waitUntil: 'load',
              timeout: 60000
            });
          } catch (loadError2) {
            // Final fallback to domcontentloaded
            console.log(`[Premium PDF Generator] Load wait failed, trying domcontentloaded for ${section.label}...`);
            await page.setContent(fullSectionHtml, { 
              waitUntil: 'domcontentloaded',
              timeout: 60000
            });
          }
        }
        
        // 4. Wait for fonts to load - CRITICAL for proper rendering
        try {
          // Wait for document.fonts.ready promise
          await page.evaluate(async () => {
            if (document.fonts && document.fonts.ready) {
              await document.fonts.ready;
            }
          });
          
          // Additional wait to ensure fonts are applied
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (fontError) {
          console.warn(`[Premium PDF Generator] Font loading warning for ${section.label}:`, fontError.message);
          // Still wait a bit even if font loading fails
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // #region agent log - Page loaded verification
        const pageInfo = await page.evaluate(() => {
          return {
            fontsLoaded: document.fonts ? document.fonts.check('16px Cinzel') : 'unknown',
            fontsReady: document.fonts ? document.fonts.status : 'unknown',
            fontFamilies: Array.from(document.fonts || []).map(f => f.family),
            hasSvg: !!document.querySelector('svg'),
            hasImages: document.querySelectorAll('img').length,
            bodyText: document.body?.innerText?.substring(0, 100) || '',
            computedStyles: {
              fontFamily: window.getComputedStyle(document.body)?.fontFamily || '',
            },
          };
        }).catch(() => ({}));
        console.log(`[Premium PDF Generator] Page loaded for ${section.label}:`, pageInfo);
        // #endregion
        
        // 5. Generate a PDF buffer for JUST this section
        const pdfOptions = {
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
        };
        
        // #region agent log - PDF generation
        console.log(`[Premium PDF Generator] Generating PDF for ${section.label}:`, pdfOptions);
        // #endregion
        
        const sectionBuffer = await page.pdf(pdfOptions);
        
        // #region agent log - PDF generated
        console.log(`[Premium PDF Generator] PDF generated for ${section.label}:`, {
          bufferLength: sectionBuffer.length,
          bufferSizeKB: Math.round(sectionBuffer.length / 1024),
        });
        // #endregion
        
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
    if (browser) {
      try {
    await browser.close();
      } catch (closeError) {
        // Ignore browser close errors
      }
    }
    throw error;
  }
}





