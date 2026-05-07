/**
 * Lightweight Sanity HTTP client — no npm dependency.
 * Wraps Sanity's REST API with fetch.
 */

const SANITY_PROJECT_ID = 'kicslgfz';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = 'v2024-05-01';

function getBaseUrl(useCdn) {
  const host = useCdn ? `${SANITY_PROJECT_ID}.apicdn.sanity.io` : `${SANITY_PROJECT_ID}.api.sanity.io`;
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

  async mutate(mutations) {
    const url = `${this.baseUrl}/mutate/${this.dataset}?returnIds=true&returnDocuments=true`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this._headers(),
      body: JSON.stringify({ mutations }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.description || data.error?.message || 'Sanity mutation failed');
    return data.results;
  }

  async create(doc) {
    const results = await this.mutate([{ create: doc }]);
    return results[0].document;
  }

  async createIfNotExists(doc) {
    const results = await this.mutate([{ createIfNotExists: doc }]);
    return results[0].document;
  }

  async createOrReplace(doc) {
    const results = await this.mutate([{ createOrReplace: doc }]);
    return results[0].document;
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

  async fetch(query, params = {}) {
    const searchParams = new URLSearchParams({ query });
    for (const [key, value] of Object.entries(params || {})) {
      searchParams.set(`$${key}`, JSON.stringify(value));
    }
    const url = `${this.baseUrl}/query/${this.dataset}?${searchParams.toString()}`;
    const res = await fetch(url, {
      headers: this._headers(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.description || data.error?.message || 'Sanity query failed');
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


export function portableTextToHtml(blocks = []) {
  if (!Array.isArray(blocks)) return String(blocks || '');
  const escapeHtml = (value = '') => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return blocks
    .filter(block => block?._type === 'block')
    .map(block => {
      const text = escapeHtml(block.children?.map(child => child.text).join('') || '');
      const style = block.style || 'normal';
      if (style === 'h1') return `<h1>${text}</h1>`;
      if (style === 'h2') return `<h2>${text}</h2>`;
      if (style === 'h3') return `<h3>${text}</h3>`;
      if (style === 'blockquote') return `<blockquote>${text}</blockquote>`;
      return `<p>${text}</p>`;
    })
    .join('\n');
}
