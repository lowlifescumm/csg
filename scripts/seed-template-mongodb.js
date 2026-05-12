const logger = require('./lib/logger');
/**
 * Seed script for MongoDB (alternative implementation)
 * 
 * Usage:
 *   MONGODB_URI="mongodb://..." node scripts/seed-template-mongodb.js
 */

import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Template } from '../database/pdf-templates-mongodb-schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mongodbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongodbUri) {
  logger.error('❌ Error: MONGODB_URI not set');
  logger.error('Usage: MONGODB_URI="mongodb://..." node scripts/seed-template-mongodb.js');
  process.exit(1);
}

async function seed() {
  try {
    logger.info('🌱 Connecting to MongoDB...');
    await mongoose.connect(mongodbUri);
    logger.info('✅ Connected to MongoDB');

    // Load sample template JSON
    const templatePath = join(__dirname, 'sample-pdfme-template.json');
    const sampleTemplate = JSON.parse(readFileSync(templatePath, 'utf8'));

    // Generate preview HTML
    const previewHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Template Preview: sample-pdfme</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .field { margin: 10px 0; padding: 10px; background: #f5f5f5; border-left: 3px solid #007bff; }
          .field-name { font-weight: bold; color: #007bff; }
        </style>
      </head>
      <body>
        <h1>PDFme Template Preview</h1>
        <h2>Template: sample-pdfme</h2>
        <p>This template contains the following fields:</p>
        <div class="field">
          <span class="field-name">userName</span> - User's name (text field)
        </div>
        <div class="field">
          <span class="field-name">userSunSign</span> - User's sun sign (text field)
        </div>
        <div class="field">
          <span class="field-name">section1Title</span> - Section title (text field)
        </div>
        <div class="field">
          <span class="field-name">section1Content</span> - Section content (text field)
        </div>
        <div class="field">
          <span class="field-name">generatedAt</span> - Generation timestamp (text field)
        </div>
      </body>
      </html>
    `.trim();

    // Check if template already exists
    const existing = await Template.findOne({ name: 'sample-pdfme' });
    if (existing) {
      logger.info('⚠️  Template "sample-pdfme" already exists. Updating...');
      existing.templateJson = sampleTemplate;
      existing.previewHtml = previewHtml;
      await existing.save();
      logger.info('✅ Updated existing template');
      logger.info(`   ID: ${existing._id}`);
    } else {
      // Create new template
      const template = new Template({
        name: 'sample-pdfme',
        ownerId: 'internal',
        templateJson: sampleTemplate,
        previewHtml: previewHtml,
        isActive: true,
      });

      const saved = await template.save();
      logger.info('✅ Successfully seeded sample template!');
      logger.info(`   ID: ${saved._id}`);
      logger.info(`   Name: ${saved.name}`);
      logger.info(`   Created: ${saved.createdAt}`);
    }

    logger.info('');
    logger.info('📋 You can now use this template with:');
    logger.info(`   curl -X POST "...?engine=template&templateId=<ID>" ...`);

    await mongoose.disconnect();
    logger.info('✨ Seed completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Seed failed:', error.message);
    logger.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seed();

