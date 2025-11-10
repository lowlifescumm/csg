#!/usr/bin/env node
/**
 * @fileoverview This script initializes the Pinecone index for the application.
 * It ensures that the specified index exists, creating it if necessary.
 *
 * @usage
 * To run this script, use the following command:
 * node scripts/pinecone-init.js
 *
 * @environment_variables
 * - PINECONE_INDEX: The name of the Pinecone index. Defaults to 'csg-tarot'.
 * - PINECONE_DIM: The dimension of the vectors in the index. Defaults to 1536.
 * - PINECONE_METRIC: The distance metric to use. Defaults to 'cosine'.
 */
import 'dotenv/config';
import { ensureIndex } from '../lib/pinecone.js';

/**
 * The main function that initializes the Pinecone index.
 */
async function main() {
  const indexName = process.env.PINECONE_INDEX || 'csg-tarot';
  const dimension = parseInt(process.env.PINECONE_DIM || '1536', 10);
  const metric = process.env.PINECONE_METRIC || 'cosine';
  await ensureIndex({ name: indexName, dimension, metric });
  console.log(`Pinecone index ready: ${indexName}`);
}

main().catch((err) => {
  console.error('Pinecone init failed:', err);
  process.exit(1);
});
