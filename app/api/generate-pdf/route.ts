/**
 * Premium PDF Generation API Route
 * Uses Puppeteer to render React component and generate e-book quality PDF
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Import Puppeteer dynamically to avoid bundling issues
async function getPuppeteer() {
  try {
    const puppeteer = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');
    return { puppeteer, chromium };
  } catch (error) {
    // Fallback to regular puppeteer for local development
    const puppeteer = await import('puppeteer');
    return { puppeteer, chromium: null };
  }
}

interface GeneratePDFRequest {
  userData: {
    name: string;
    birthDate: string;
    birthTime: string;
    location: string;
    sunSign?: string;
    moonSign?: string;
    risingSign?: string;
    birthChartSvg?: string;
    compatibilityChartSvg?: string;
    sections?: Array<{
      type: string;
      title: string;
      content: string;
    }>;
    compatibilityScores?: {
      emotional?: number;
      communication?: number;
      spiritual?: number;
      stability?: number;
      physical?: number;
    };
    base64BackgroundImage?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePDFRequest = await request.json();
    const { userData } = body;

    if (!userData || !userData.name) {
      return NextResponse.json(
        { error: 'userData with name is required' },
        { status: 400 }
      );
    }

    // Dynamically import React and ReactDOMServer to avoid Next.js build restrictions
    // @ts-ignore - react-dom/server types are included in @types/react-dom but TypeScript can't resolve dynamically
    const React = await import('react');
    // @ts-ignore - react-dom/server types are included in @types/react-dom but TypeScript can't resolve dynamically
    const ReactDOMServer = await import('react-dom/server');
    // Use correct relative path (3 levels up from app/api/generate-pdf to root, then into components)
    // @ts-ignore - Dynamic import with path alias requires runtime resolution
    const { default: MasterReport } = await import('../../../components/pdf/MasterReport');
    
        // Fallback: load default background image if none provided
    try {
      if (!userData.base64BackgroundImage) {
        const fs = await import('fs');
        const path = await import('path');
        
        // Try multiple possible paths (for different deployment environments)
        const possiblePaths = [
          path.join(process.cwd(), 'docs', 'Nebula.jpg'),
          path.join(process.cwd(), 'csg', 'docs', 'Nebula.jpg'),
        ];
        
        let bgPath = null;
        for (const testPath of possiblePaths) {
          if (fs.existsSync(testPath)) {
            bgPath = testPath;
            console.log('[PDF Generator] Found background image at:', bgPath);
            break;
          }
        }
        
        if (bgPath) {
          const base64 = fs.readFileSync(bgPath).toString('base64');
          userData.base64BackgroundImage = `data:image/jpeg;base64,${base64}`;
          console.log('[PDF Generator] Loaded default background image, size:', base64.length, 'chars');
        } else {
          console.warn('[PDF Generator] Background image not found in any of these paths:', possiblePaths);
        }
      } else {
        console.log('[PDF Generator] Using provided background image');
      }
    } catch (err) {
      console.error('[PDF Generator] Error loading default background image:', err);
    }
    }

    // Render React component to HTML
    const htmlContent = ReactDOMServer.renderToStaticMarkup(
      React.createElement(MasterReport, { userData })
    );

    // Read CSS file
    const fs = await import('fs');
    const path = await import('path');
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
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    ${cssContent}
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>
    `;

    // Get Puppeteer
    const { puppeteer, chromium } = await getPuppeteer();

    // Launch browser with proper configuration
    const launchOptions: any = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    // Use Chromium executable path if available (for production/Render.com)
    if (chromium) {
      try {
        const chromiumAny = chromium as any;
        // @ts-ignore - setGraphicsMode may not exist in all versions of @sparticuz/chromium
        if (typeof chromiumAny.setGraphicsMode === 'function') {
          chromiumAny.setGraphicsMode(false);
        }
        // @ts-ignore - executablePath may be a function or property depending on chromium version
        const executablePath = typeof chromiumAny.executablePath === 'function' 
          ? await chromiumAny.executablePath() 
          : chromiumAny.executablePath;
        if (executablePath) {
          launchOptions.executablePath = executablePath;
          launchOptions.args = chromiumAny.args || launchOptions.args;
          launchOptions.defaultViewport = chromiumAny.defaultViewport || launchOptions.defaultViewport;
          launchOptions.headless = chromiumAny.headless !== false;
        }
      } catch (error) {
        console.warn('[PDF Generator] Chromium executablePath failed, using system Chrome:', error);
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
      // @ts-ignore - TypeScript has issues with evaluate overloads for async functions
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      // Additional wait to ensure fonts are rendered
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate PDF with proper options
      const pdfBuffer = await page.pdf({
        format: 'a4',
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

      // Return PDF as response (convert Buffer to acceptable type)
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="master-report-${userData.name.replace(/\s+/g, '-').toLowerCase()}.pdf"`,
        },
      });
    } catch (error) {
      await browser.close();
      throw error;
    }
  } catch (error: any) {
    console.error('[PDF Generator] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error.message,
      },
      { status: 500 }
    );
  }
}


