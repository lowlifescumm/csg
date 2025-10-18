import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient;

export function getPinecone() {
  if (pineconeClient) return pineconeClient;
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error("PINECONE_API_KEY is not set");
  pineconeClient = new Pinecone({ apiKey });
  return pineconeClient;
}

export async function ensureIndex({ name, dimension = 1536, metric = "cosine", spec } = {}) {
  const client = getPinecone();
  const existing = await client.listIndexes();
  const has = Array.isArray(existing) ? existing.includes(name) : false;
  if (!has) {
    const region = process.env.PINECONE_REGION || 'us-east-1';
    const serverlessSpec = spec || { serverless: { cloud: 'aws', region } };
    await client.createIndex({
      name,
      dimension,
      metric,
      spec: serverlessSpec,
    });
  }
  return client.index(name);
}


