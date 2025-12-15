/**
 * Premium PDF Generator
 * Generates e-book quality PDFs using React component + Puppeteer
 * 
 * NOTE: This is a server-only utility. Uses dynamic imports for React to avoid Next.js build issues.
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import fs from 'fs';
import path from 'path';

/**
 * Generate premium PDF from user data
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
  }

  // Dynamically import React and ReactDOMServer to avoid Next.js build restrictions
  const React = await import('react');
  const ReactDOMServer = await import('react-dom/server');
  
  // Dynamically import the MasterReport component (avoid SSR issues)
  const { default: MasterReport } = await import('@/components/pdf/MasterReport');
  
  // Render React component to HTML
  const htmlContent = ReactDOMServer.renderToStaticMarkup(
    React.createElement(MasterReport, { userData })
  );

  // Read CSS file
  const cssPath = path.join(process.cwd(), 'styles', 'PrintReport.css');
  const cssContent = fs.existsSync(cssPath)
    ? fs.readFileSync(cssPath, 'utf-8')
    : '/* CSS file not found */';

  // Create full HTML document with styles
  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Master Report - ${userData.name}</title>
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

  const browser = await puppeteer.launch(launchOptions);

  try {
    const page = await browser.newPage();

    // Set A4 viewport
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
    });

    // Set content and wait for fonts
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    // CRITICAL: Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');
    // Additional wait to ensure fonts are rendered
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate PDF with proper options
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 8pt; color: #d4af37; text-align: center; width: 100%; font-family: 'Cinzel', serif;">
          COSMIC SPIRITUAL GUIDE // PREPARED FOR <span class="title">${userData.name}</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 8pt; color: #d4af37; text-align: right; width: 100%; font-family: 'Cinzel', serif; padding-right: 20mm;">
          Page <span class="pageNumber"></span>
        </div>
      `,
      margin: {
        top: '20mm',
        right: '0mm',
        bottom: '20mm',
        left: '0mm',
      },
      preferCSSPageSize: false,
    });

    await browser.close();
    return pdfBuffer;
  } catch (error) {
    await browser.close();
    throw error;
  }
}



