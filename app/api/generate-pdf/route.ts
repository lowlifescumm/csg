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
        if (typeof chromium.setGraphicsMode === 'function') {
          chromium.setGraphicsMode(false);
        }
        launchOptions.executablePath = await chromium.executablePath();
        launchOptions.args = chromium.args;
        launchOptions.defaultViewport = chromium.defaultViewport;
        launchOptions.headless = chromium.headless;
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
      await page.evaluateHandle('document.fonts.ready');
      // Additional wait to ensure fonts are rendered
      await page.waitForTimeout(1000);

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

      // Return PDF as response
      return new NextResponse(pdfBuffer, {
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

