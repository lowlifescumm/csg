const logger = require('./lib/logger');
#!/usr/bin/env node
import 'dotenv/config';
import { ensureIndex } from '../lib/pinecone.js';

async function main() {
  const indexName = process.env.PINECONE_INDEX || 'csg-tarot';
  const dimension = parseInt(process.env.PINECONE_DIM || '1536', 10);
  const metric = process.env.PINECONE_METRIC || 'cosine';
  await ensureIndex({ name: indexName, dimension, metric });
  logger.info(`Pinecone index ready: ${indexName}`);
}

main().catch((err) => {
  logger.error('Pinecone init failed:', err);
  process.exit(1);
});


