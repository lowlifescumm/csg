require('dotenv').config({ path: '/home/ethan/csg/.env.local' });
const { sanityWriteClient } = require('/home/ethan/csg/lib/sanity.js');

const docId = 'blogPost.twin-flame-vs-soulmate-the-real-difference-and-how-to-know-which-you-ve-met';

const blocks = {
  'b64the-fastest-way-to': {
    _key: 'b64the-fastest-way-to',
    _type: 'block',
    markDefs: [
      { _type: 'link', _key: 'link-compat', href: '/compatibility' },
      { _type: 'link', _key: 'link-bc', href: '/birth-chart' },
    ],
    children: [
      { _type: 'span', _key: 's64a', text: 'The fastest way to see which of these signatures are active in your connection is to compare your charts. Our free ', marks: [] },
      { _type: 'span', _key: 's64b', text: 'compatibility calculator', marks: ['link-compat'] },
      { _type: 'span', _key: 's64c', text: " takes two birth dates and returns a breakdown of how your charts interact — including elemental harmony, communication style, and overall relationship tendency. For deeper synastry (moon, Saturn, Pluto aspects), add birth times and use the full ", marks: [] },
      { _type: 'span', _key: 's64d', text: 'birth chart calculator', marks: ['link-bc'] },
      { _type: 'span', _key: 's64e', text: '.', marks: [] },
    ],
    style: 'normal',
  },
  'b65if-you-re-still-tr': {
    _key: 'b65if-you-re-still-tr',
    _type: 'block',
    markDefs: [{ _type: 'link', _key: 'link-zodiac', href: '/zodiac' }],
    children: [
      { _type: 'span', _key: 's65a', text: "If you're still trying to figure out which zodiac sign you're most compatible with, the ", marks: [] },
      { _type: 'span', _key: 's65b', text: 'zodiac sign guides', marks: ['link-zodiac'] },
      { _type: 'span', _key: 's65c', text: ' break down traits, love style, and compatibility for each sign.', marks: [] },
    ],
    style: 'normal',
  },
  'b91if-a-specific-pers': {
    _key: 'b91if-a-specific-pers',
    _type: 'block',
    markDefs: [{ _type: 'link', _key: 'link-compat2', href: '/compatibility' }],
    children: [
      { _type: 'span', _key: 's91a', text: 'If a specific person came to mind while you read this, the next step is simple: compare your charts. Use the free ', marks: [] },
      { _type: 'span', _key: 's91b', text: 'compatibility calculator', marks: ['link-compat2'] },
      { _type: 'span', _key: 's91c', text: ' to see how your energies actually interact — element by element, planet by planet. The numbers won\'t tell you whether they\'re "the one," but they\'ll tell you what kind of connection you\'re in and what it\'s asking of you.', marks: [] },
    ],
    style: 'normal',
  },
  'b92if-you-want-to-go-': {
    _key: 'b92if-you-want-to-go-',
    _type: 'block',
    markDefs: [{ _type: 'link', _key: 'link-bc2', href: '/birth-chart' }],
    children: [
      { _type: 'span', _key: 's92a', text: 'If you want to go deeper, ', marks: [] },
      { _type: 'span', _key: 's92b', text: 'calculate your full birth chart', marks: ['link-bc2'] },
      { _type: 'span', _key: 's92c', text: ' first. The more accurate your birth time, the more precise your synastry reading will be.', marks: [] },
    ],
    style: 'normal',
  },
};

async function main() {
  const mutations = Object.entries(blocks).map(([key, block]) => ({
    patch: {
      id: docId,
      set: { [`content[_key=="${key}"]`]: block },
    },
  }));

  const url = `${sanityWriteClient.baseUrl}/mutate/${sanityWriteClient.dataset}?returnIds=true&returnDocuments=true`;
  const res = await fetch(url, {
    method: 'POST',
    headers: sanityWriteClient._headers(),
    body: JSON.stringify({ mutations }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('FAILED:', JSON.stringify(data, null, 2));
    throw new Error(data.error?.description || 'patch failed');
  }
  console.log('Patched. Rev:', data.results?.[0]?.document?._rev);
  console.log('Operation count:', data.results?.length);
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });