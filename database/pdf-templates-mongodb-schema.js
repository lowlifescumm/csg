/**
 * MongoDB Schema for PDF Templates (Mongoose example)
 * Use this if you prefer MongoDB over PostgreSQL
 */

import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    index: true,
  },
  ownerId: {
    type: String,
    index: true,
  },
  templateJson: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  previewHtml: {
    type: String,
  },
  // Optional fields for compatibility with existing system
  reportType: {
    type: String,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
}, { 
  timestamps: true, // Adds createdAt and updatedAt automatically
});

// Indexes
TemplateSchema.index({ ownerId: 1, name: 1 });
TemplateSchema.index({ reportType: 1, isDefault: 1 });

export const Template = mongoose.model('Template', TemplateSchema);

