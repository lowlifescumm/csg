require('dotenv').config({ path: '/home/ethan/csg/.env.local' });
const fs = require('fs');
const { createPostInSanity } = require('/home/ethan/csg/lib/sanity-write.js');

async function main() {
  const md = fs.readFileSync('/home/ethan/csg/content/drafts/twin-flame-vs-soulmate.md', 'utf8');

  const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) throw new Error('Missing frontmatter');
  const fm = fmMatch[1];
  const body = fmMatch[2];

  const getFm = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*"([^"]*)"`, 'm'));
    return m ? m[1] : '';
  };
  const getList = (key) => {
    const m = fm.match(new RegExp(`^${key}:\\s*\\[([^\\]]*)\\]`, 'm'));
    if (!m) return [];
    return m[1].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  };

  const title = getFm('title');
  const slug = getFm('slug');
  const excerpt = getFm('excerpt');
  const metaTitle = getFm('meta_title') || title;
  const metaDescription = getFm('meta_description') || excerpt;
  const readingTime = parseInt(getFm('reading_time') || '9', 10);
  const category = getFm('category') || 'Compatibility';
  const tags = getList('tags');

  const html = body
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[(.+?)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .split(/\n{2,}/)
    .map(p => {
      const t = p.trim();
      if (!t) return '';
      if (/^<h[123]/.test(t)) return t;
      if (/^<table>/.test(t) || /<\/table>$/.test(t)) return t;
      if (/^\| /.test(t)) return t;
      if (/^<a |^<strong/.test(t)) return `<p>${t}</p>`;
      if (/^- /.test(t)) {
        const items = t.split(/\n/).filter(Boolean).map(l => l.replace(/^- /, '').replace(/^(\d+)\. /, '<strong>$1.</strong> '));
        return `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;
      }
      if (/^\d+\. /.test(t)) {
        const items = t.split(/\n/).filter(Boolean).map(l => l.replace(/^\d+\. /, ''));
        return `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
      }
      return `<p>${t}</p>`;
    })
    .join('\n');

  const post = {
    title,
    slug,
    excerpt,
    content: html,
    status: 'published',
    published_at: new Date().toISOString(),
    category,
    tags,
    meta_title: metaTitle,
    meta_description: metaDescription,
    reading_time: readingTime,
    author: 'Cosmic Spirit Guide',
  };

  console.log('Creating post in Sanity:', post.title, post.slug);
  const result = await createPostInSanity(post);
  console.log('Sanity result:', JSON.stringify(result, null, 2));
}

main().catch(e => { console.error('ERROR:', e); process.exit(1); });