/**
 * Lightweight Sanity HTTP client — no npm dependency.
 * Wraps Sanity's REST API with fetch.
 */

const SANITY_PROJECT_ID = 'kicslgfz';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = 'v2024-05-01';

function getBaseUrl(useCdn) {
  const host = useCdn ? 'apicdn.sanity.io' : 'api.sanity.io';
  return `https://${host}/${SANITY_API_VERSION}/data`;
}

export class LightweightSanityClient {
  constructor({ token, useCdn = false }) {
    this.token = token;
    this.baseUrl = getBaseUrl(useCdn);
    this.projectId = SANITY_PROJECT_ID;
    this.dataset = SANITY_DATASET;
  }

  _headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  async create(doc) {
    const url = `${this.baseUrl}/mutate/${this.dataset}?returnIds=true&returnDocuments=true`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ mutations: [{ create: doc }] }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.description || 'Sanity create failed');
    return data.results[0].document;
  }

  async patch(docId) {
    const mutations = { patch: { id: docId, set: {} } };
    return {
      set: (obj) => { Object.assign(mutations.patch.set, obj); return this; },
      commit: async () => {
        const url = `${this.baseUrl}/mutate/${this.dataset}?returnIds=true&returnDocuments=true`;
        const res = await fetch(url, {
          method: 'POST',
          headers: this._headers(),
          body: JSON.stringify({ mutations: [mutations] }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.description || 'Sanity patch failed');
        return data.results[0].document;
      },
    };
  }

  async delete(docId) {
    const url = `${this.baseUrl}/mutate/${this.dataset}?returnIds=true`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ mutations: [{ delete: { id: docId } }] }),
    });
    if (!res.ok) throw new Error('Sanity delete failed');
    return { _id: docId };
  }

  async fetch(query) {
    const encoded = encodeURIComponent(query);
    const url = `${this.baseUrl}/query/${this.dataset}?query=${encoded}`;
    const res = await fetch(url, {
      headers: this._headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.description || 'Sanity query failed');
    return data.result;
  }
}

// ─── Pre-configured clients ────────────────────────────────────────

export const sanityClient = new LightweightSanityClient({
  token: process.env.SANITY_API_TOKEN,
  useCdn: true,
});

export const sanityWriteClient = new LightweightSanityClient({
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

// ─── Image URL builder ─────────────────────────────────────────────

export function imageUrlBuilder(source) {
  const ref = source?._ref || source?.asset?._ref || source;
  if (!ref) return { width: () => ({ url: () => '' }) };
  return {
    width: (w) => ({
      url: () => `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${ref.replace('image-', '').replace(/-[a-z]+$/, '')}-${w}x${Math.round(w * 0.56)}.jpg`,
    }),
    url: () => `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${ref.replace('image-', '').replace(/-[a-z]+$/, '')}-800x450.jpg`,
  };
}

export function urlFor(source) {
  return imageUrlBuilder(source);
}

// ─── Portable text helpers ───────────────────────────────────────

export function portableTextToPlainText(blocks = []) {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map(child => child.text).join('') || '')
    .join('\n\n');
}
