import { Pinecone } from "@pinecone-database/pinecone";

let pineconeClient;

export function getPinecone() {
  if (pineconeClient) return pineconeClient;
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) throw new Error("PINECONE_API_KEY is not set");
  pineconeClient = new Pinecone({ apiKey });
  return pineconeClient;
}

export async function ensureIndex({ name, dimension = 1536, metric = "cosine", spec = {} }) {
  const client = getPinecone();
  const existing = await client.indexes.list();
  const has = existing.indexes?.some(i => i.name === name);
  if (!has) {
    await client.indexes.create({
      name,
      dimension,
      metric,
      spec,
    });
  }
  return client.index(name);
}


