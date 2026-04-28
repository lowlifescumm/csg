#!/usr/bin/env node
/**
 * dispatch-content-pipeline.js
 * 
 * CEO heartbeat script: Scans the content calendar for overdue workflow steps
 * and dispatches the appropriate Paperclip content agents to handle them.
 * 
 * Usage: node scripts/dispatch-content-pipeline.js [--dry-run]
 * 
 * Paperclip API: http://127.0.0.1:3100
 * Company ID:    84898c57-acb2-43a9-a0e7-b22d600d3434
 */

const https = require('https');

const PAPERCLIP_API = 'http://127.0.0.1:3100';
const COMPANY_ID    = '84898c57-acb2-43a9-a0e7-b22d600d3434';
const CSG_API_BASE  = 'https://cosmicspiritguide.com';

// Paperclip FRO key (from Render dashboard env: FRO_API_KEY)
const PAPERCLIP_KEY = process.env.FRO_API_KEY ||
  (() => { try { return require('/home/ethan/.openclaw/workspace/paperclip-claimed-api-key.json').token; } catch { return ''; } })();

// Same key authenticates calls to the CSG content-workflow API
const CSG_API_KEY = process.env.FRO_API_KEY || PAPERCLIP_KEY;

const AGENT_IDS = {
  // content_writer — handled externally by Hermes blog pipeline (hermes-supervisor.js)
  // No Paperclip agent assigned; Hermes owns all research/draft/edit steps
  content_writer:      null,   // DO NOT ASSIGN — Hermes handles this
  seo_strategist:      '959f10bc-d0f2-4022-86c0-3b1e9634f117', // SEO Strategist
  social_media_manager: 'cd00a527-5249-4025-b9e8-ff9f30cc23e0', // Social Media Manager
  editor:              '48ec7111-983c-44fe-a498-5871b39a41f9', // COO v2
  visual_artist:       'cd00a527-5249-4025-b9e8-ff9f30cc23e0', // Social Media Manager (temp)
  content_manager:     '48ec7111-983c-44fe-a498-5871b39a41f9', // COO v2 — coordinator gatekeeper only
  ceo:                 '38177575-f35e-44d3-a243-91d49adef723', // CEO Frank
};

// Step → agent type mapping
const STEP_AGENT = {
  research:    null, // Hermes pipeline — DO NOT DISPATCH
  outline:     null, // Hermes pipeline — DO NOT DISPATCH
  draft:       null, // Hermes pipeline — DO NOT DISPATCH
  edit:        'editor',
  seo_review:  'seo_strategist',
  images:      'visual_artist',
  schedule:    'content_manager',
  publish:     'content_manager',
  promote:     'social_media_manager',
};

const WORKFLOW_STEPS = [
  'research', 'outline', 'draft', 'edit', 'seo_review',
  'images', 'schedule', 'publish', 'promote'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadPaperclipKey() { return PAPERCLIP_KEY; }

async function paperclipGet(path) {
  const key = loadPaperclipKey();
  const res = await fetch(`${PAPERCLIP_API}${path}`, {
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paperclip GET ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function paperclipPost(path, body) {
  const key = loadPaperclipKey();
  const res = await fetch(`${PAPERCLIP_API}${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paperclip POST ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

async function paperclipPatch(path, body) {
  const key = loadPaperclipKey();
  const res = await fetch(`${PAPERCLIP_API}${path}`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paperclip PATCH ${path} → ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function stepDueDate(publishDate, step) {
  const offsets = {
    research: 14, outline: 10, draft: 7, edit: 4,
    seo_review: 3, images: 2, schedule: 1, publish: 0, promote: -1
  };
  const d = new Date(publishDate);
  d.setDate(d.getDate() - (offsets[step] ?? 7));
  return d.toISOString().split('T')[0];
}

// ─── HTTP helper ───────────────────────────────────────────────────────────────

function httpGet(url, extraHeaders) {
  return new Promise((resolve, reject) => {
    const headers = { 'Content-Type': 'application/json', ...(extraHeaders || {}) };
    const req = https.get(url, { headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve(data); } });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

function httpPost(url, body, extraHeaders) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const hostname = new URL(url).hostname;
    const path = new URL(url).pathname;
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      ...(extraHeaders || {})
    };
    const opts = { hostname, path, method: 'POST', headers };
    if (url.includes('127.0.0.1')) { opts.hostname = '127.0.0.1'; opts.rejectUnauthorized = false; }
    const req = https.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ─── Get overdue steps from CSG API ──────────────────────────────────────────

async function getOverdueSteps() {
  const data = await httpGet(`${CSG_API_BASE}/api/content-calendar?upcoming=true`, { 'Authorization': `Bearer ${CSG_API_KEY}` });
  const items = data.calendar || [];
  const now = new Date().toISOString().split('T')[0];

  const overdue = [];
  for (const item of items) {
    if (item.status === 'published' || item.status === 'promoted') continue;
    for (const step of (item.workflow_steps || [])) {
      if ((step.status === 'pending' || step.status === 'in_progress') && step.due_date <= now) {
        overdue.push({
          workflow_id: step.id,
          step_name: step.step_name,
          step_status: step.status,
          due_date: step.due_date,
          assigned_to: step.assigned_to,
          calendar_id: item.id,
          title: item.title,
          target_keyword: item.target_keyword,
          target_url_slug: item.target_url_slug,
          publish_date: item.publish_date,
          calendar_status: item.status,
          post_id: item.actual_post_id || item.post_id,
          post_slug: null,
        });
      }
    }
  }
  return overdue;
}

// ─── Find or create Paperclip issue for a step ───────────────────────────────

async function findOrCreateIssue(calendarItem, step, stepIndex) {
  const title = `Blog Post Step: ${step} — "${calendarItem.title}"`;
  
  // Check if an issue already exists for this step
  const issues = await paperclipGet(
    `/api/companies/${COMPANY_ID}/issues?limit=100`
  );
  const items = issues.items ?? issues;
  const existing = items.find(i =>
    i.title?.includes(` ${step} — `) &&
    i.title?.includes(calendarItem.title) &&
    i.status !== 'done' && i.status !== 'cancelled'
  );

  if (existing) {
    console.log(`  [FRO-${existing.issueNumber}] Already exists for ${step}`);
    return existing;
  }

  // Create new issue
  const stepNames = WORKFLOW_STEPS.join(', ');
  const description = `
## Content Pipeline Task: ${step}

**Calendar Item:** ${calendarItem.title}
**Keyword:** ${calendarItem.target_keyword}
**Publish Date:** ${calendarItem.publish_date?.split('T')[0]}
**Workflow Step:** ${step} (step ${stepIndex + 1} of 9)
**Due Date:** ${stepDueDate(calendarItem.publish_date, step)}

## Instructions

This is step **${step}** of the blog post publishing workflow.
Complete this step and report back via the content-workflow API.

## Step-Specific Guidance

${getStepGuidance(step, calendarItem)}
`.trim();

  const issue = await paperclipPost(
    `/api/companies/${COMPANY_ID}/issues`,
    {
      title,
      description,
      status: 'todo',
      priority: calendarItem.calendar_status === 'high' ? 'high' : 'medium',
      labels: [step, 'content-pipeline', 'blog-post'],
    }
  );

  console.log(`  [NEW] Created FRO-${issue.issueNumber} for ${step}`);
  return issue;
}

function getStepGuidance(step, calendarItem) {
  const kw = calendarItem.target_keyword || '';
  const base = `Keyword: "${kw}" | Post: "${calendarItem.title}"`;
  
  const guides = {
    research: `
You are a content researcher for Cosmicspiritguide.com, an astrology/spiritual wellness site.
Your task: Research the topic "${calendarItem.title}" targeting keyword "${kw}".

Steps:
1. Search for the keyword "${kw}" - identify top-ranking articles
2. Note their structure, word count, headings, and key points covered
3. Identify gaps they missed or questions they didn't answer
4. Find 3-5 credible sources (astrology blogs, academic references)
5. Compile a brief covering:
   - Target keyword + secondary keywords
   - Search intent (informational/navigational/transactional)
   - Recommended word count (1500-3000 words for SEO)
   - Key points to cover (at least 6 H2 sections)
   - CTA strategy (link to relevant free tool on the site)
   - Competitor gaps

POST results to: https://cosmicspiritguide.com/api/content-workflow
With: { "calendarId": ${calendarItem.calendar_id}, "step": "research", "action": "complete", "agentType": "content_writer", ... }
`,
    outline: `
You are a content strategist for Cosmicspiritguide.com.
Create a detailed outline for the blog post "${calendarItem.title}" targeting "${kw}".

The outline should include:
1. Title (H1) - SEO-optimized, compelling click
2. Introduction (3-4 sentences) - hook + what the reader will learn
3. At least 6 H2 sections with bullet points for each
4. FAQ section (3 questions matching "People also ask" results)
5. Conclusion with CTA

POST the outline JSON to: https://cosmicspiritguide.com/api/content-workflow
Format: { "calendarId": ${calendarItem.calendar_id}, "step": "outline", "action": "complete", "outline": [{h2: "...", points: ["..."]}, ...], "agentType": "content_writer" }
`,
    draft: `
You are a content writer for Cosmicspiritguide.com.
Write the full first draft of: "${calendarItem.title}"

Requirements:
- Target keyword: "${kw}"
- Word count: 1500-2500 words
- Tone: Warm, authoritative, accessible (not academic)
- Include the outline structure from the previous step
- Write complete, publication-ready paragraphs (not bullet lists)
- Include internal links to relevant site tools where natural
- End with a CTA linking to the site's free tools

POST the full HTML content to: https://cosmicspiritguide.com/api/content-workflow
Format: { "calendarId": ${calendarItem.calendar_id}, "step": "draft", "action": "complete", "content": "<article>...</article>", "excerpt": "...", "agentType": "content_writer" }
`,
    edit: `
You are a senior editor for Cosmicspiritguide.com.
Edit the draft for: "${calendarItem.title}"

Check and improve:
1. Flow and readability - does it hold attention?
2. Grammar, punctuation, style consistency
3. Astrological accuracy - verify all sign dates, dates, symbol names
4. Does the intro hook the reader in the first 30 words?
5. Is the CTA at the end clear and compelling?
6. Are section transitions smooth?

Keep the author's voice but elevate the quality.
Return the edited HTML.
`,
    seo_review: `
You are an SEO strategist for Cosmicspiritguide.com.
Optimize meta fields for: "${calendarItem.title}"

Deliver:
1. meta_title (max 60 chars, includes keyword "${kw}")
2. meta_description (max 160 chars, compelling, includes CTA)
3. tags (array of 5-8 relevant tags)
4. Verify H1 matches the target keyword
5. Check keyword density is natural (1-2%)

POST to: { "calendarId": ${calendarItem.calendar_id}, "step": "seo_review", "action": "complete", "metaTitle": "...", "metaDescription": "...", "tags": [...] }
`,
    images: `
You are a visual content specialist for Cosmicspiritguide.com.
Find/create the featured image for: "${calendarItem.title}"

Requirements:
- Cosmic/mystical aesthetic matching the brand
- Use Leonardo AI or another image gen tool
- Prompt should reference the topic: "${kw}"
- Save image to: https://cosmicspiritguide.com/api/upload (multipart form)
- Return the URL

POST image URL to: { "calendarId": ${calendarItem.calendar_id}, "step": "images", "action": "complete", "featuredImage": "https://..." }
`,
    schedule: `
Set the publish date for: "${calendarItem.title}"

The publish date is: ${calendarItem.publish_date?.split('T')[0]}

Confirm this date is correct and update the blog post status to 'scheduled'.
POST: { "calendarId": ${calendarItem.calendar_id}, "step": "schedule", "action": "complete", "scheduledAt": "${calendarItem.publish_date?.split('T')[0]}" }
`,
    publish: `
Publish the blog post: "${calendarItem.title}"

Verify:
1. All images are loaded
2. Meta tags are set correctly
3. Content is complete and accurate
4. Then update status to 'published'

POST: { "calendarId": ${calendarItem.calendar_id}, "step": "publish", "action": "complete" }
`,
    promote: `
Create social copy for: "${calendarItem.title}"

Generate:
1. X/Twitter post (280 chars, hook + link + #astrology #spiritual)
2. Pinterest pin description (100 chars + keyword "${kw}")
3. Instagram caption (150-300 chars, emoji, hashtag strategy)

Mark as 'manual' — Ethan will post these manually.
POST: { "calendarId": ${calendarItem.calendar_id}, "step": "promote", "action": "complete", "socialCopy": { "x": "...", "pinterest": "...", "instagram": "..." } }
`,
  };

  return guides[step] || `Complete the ${step} step for "${calendarItem.title}".`;
}

// ─── Dispatch agent to handle an issue ──────────────────────────────────────

async function dispatchAgent(issue, agentType) {
  const agentId = AGENT_IDS[agentType];
  if (!agentId) {
    // Hermes handles content_writer — log and skip Paperclip assignment
    console.log(`  [SKIP] ${agentType} is handled by Hermes blog pipeline — not assigning in Paperclip`);
    return;
  }

  console.log(`  [DISPATCH] Assigning ${agentType} (${agentId}) to FRO-${issue.issueNumber}`);

  try {
    // Assign the issue to the agent
    await paperclipPatch(`/api/agents/${agentId}`, {});
  } catch (e) {
    // Some APIs don't support direct patch — try issue assignment
  }

  // Try to assign via issue update
  try {
    await paperclipPatch(`/api/issues/${issue.id}`, {
      assigneeAgentId: agentId,
    });
    console.log(`  [OK] Assigned FRO-${issue.issueNumber} to ${agentType}`);
  } catch (e2) {
    console.log(`  [WARN] Could not assign: ${e2.message.slice(0, 100)}`);
    console.log(`  [INFO] Agent ${agentType} should pick up FRO-${issue.issueNumber} from their queue`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`\n🚀 Content Pipeline Dispatch${dryRun ? ' [DRY RUN]' : ''} — ${new Date().toISOString()}\n`);

  const authHeader = { 'Authorization': `Bearer ${CSG_API_KEY}` };

  // 1. Get overdue steps
  const overdueSteps = await getOverdueSteps();
  console.log(`📋 Found ${overdueSteps.length} overdue/in-progress steps\n`);

  if (!overdueSteps.length) {
    console.log('✅ Nothing to dispatch. All caught up.');
    return;
  }

  // 2. For each overdue step, dispatch the right agent
  const dispatched = [];
  for (const step of overdueSteps) {
    console.log(`\nProcessing: ${step.title} | ${step.step_name} (due: ${step.due_date})`);
    
    if (dryRun) {
      console.log('  [DRY RUN] Would dispatch...');
      continue;
    }

    try {
      const agentType = STEP_AGENT[step.step_name] || 'content_writer';
      const issue = await findOrCreateIssue(step, step.step_name, WORKFLOW_STEPS.indexOf(step.step_name));
      await dispatchAgent(issue, agentType);

      // Note: Step status update happens when agent completes via content-workflow API
      // We create the Paperclip issue here for the agent to pick up
      dispatched.push({ step, issue, agentType });
    } catch (err) {
      console.error(`  [ERROR] ${err.message}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Dispatched: ${dispatched.length} step(s)`);
  if (!dryRun) {
    console.log('Agents should now be picking up tasks from Paperclip dashboard.');
    console.log('Check: http://127.0.0.1:18789 (OpenClaw Control UI)');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
