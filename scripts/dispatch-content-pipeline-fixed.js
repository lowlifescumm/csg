#!/usr/bin/env node
/**
 * dispatch-content-pipeline.js (FIXED)
 * 
 * CEO heartbeat script: Scans the content calendar for overdue workflow steps
 * and dispatches the appropriate Paperclip content agents to handle them.
 * 
 * FIXED: Added proper deduplication using workflow step ID
 * 
 * Usage: node scripts/dispatch-content-pipeline.js [--dry-run]
 * 
 * Paperclip API: http://127.0.0.1:3100
 * Company ID:    df8b638f-3877-4cea-8f96-66523dfad314
 */

const https = require('https');

const PAPERCLIP_API = 'http://127.0.0.1:3100';
const COMPANY_ID    = 'df8b638f-3877-4cea-8f96-66523dfad314';
const CSG_API_BASE  = 'https://cosmicspiritguide.com';

// Paperclip FRO key (from Render dashboard env: FRO_API_KEY)
const PAPERCLIP_KEY = process.env.FRO_API_KEY ||
  (() => { try { return require('/home/ethan/.openclaw/workspace/paperclip-claimed-api-key.json').token; } catch { return ''; } })();

// Same key authenticates calls to the CSG content-workflow API
const CSG_API_KEY = process.env.FRO_API_KEY || PAPERCLIP_KEY;

// UPDATED AGENT IDS - Valid as of 2026-06-02
const AGENT_IDS = {
  // content_writer — handled externally by Hermes blog pipeline (hermes-supervisor.js)
  content_writer:      null,   // DO NOT ASSIGN — Hermes handles this
  
  // Use Content Strategist for SEO-related tasks
  seo_strategist:      '0475118d-3c87-4ae3-9f73-9b10b3566ea2', // Content Strategist
  
  // Use Staff Engineer for editor/manager tasks
  social_media_manager: '32649b6c-24a7-45db-909b-aa0316c4af54', // Staff Engineer (temp)
  editor:              '32649b6c-24a7-45db-909b-aa0316c4af54', // Staff Engineer
  visual_artist:       '32649b6c-24a7-45db-909b-aa0316c4af54', // Staff Engineer (temp)
  content_manager:     '32649b6c-24a7-45db-909b-aa0316c4af54', // Staff Engineer
  
  ceo:                 'acc03d19-4e3d-4374-8cb1-938e0f35f0ad', // CEO
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

// Cache for existing issues (populated once per run)
let existingIssuesCache = null;

// ─── Simple Logger ────────────────────────────────────────────────────────────

function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

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

// ─── Load all existing issues into cache ─────────────────────────────────────

async function loadExistingIssuesCache() {
  if (existingIssuesCache) return existingIssuesCache;
  
  log('INFO', 'Loading existing issues cache...');
  const allIssues = [];
  let offset = 0;
  const limit = 500;
  
  while (true) {
    const issues = await paperclipGet(`/api/companies/${COMPANY_ID}/issues?limit=${limit}&offset=${offset}`);
    if (!Array.isArray(issues) || issues.length === 0) break;
    
    allIssues.push(...issues);
    
    if (issues.length < limit) break;
    offset += limit;
  }
  
  existingIssuesCache = allIssues;
  log('INFO', `Cached ${allIssues.length} existing issues`);
  return allIssues;
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
  const workflowId = calendarItem.workflow_id;
  
  // Load all existing issues from cache
  const allIssues = await loadExistingIssuesCache();
  
  // Search for existing issue by workflow ID in description
  // Also check by title match as fallback
  const existing = allIssues.find(i => {
    // Check if this issue was created for this exact workflow step
    const hasWorkflowId = i.description?.includes(`Workflow Step ID: ${workflowId}`);
    const titleMatches = i.title === title || 
                        (i.title?.includes(step) && i.title?.includes(calendarItem.title));
    const isActive = i.status !== 'done' && i.status !== 'cancelled';
    
    return (hasWorkflowId || titleMatches) && isActive;
  });

  if (existing) {
    log('INFO', `  [EXISTS] FRO-${existing.issueNumber || existing.identifier} already exists for ${step} (workflow: ${workflowId})`);
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
**Workflow Step ID:** ${workflowId}
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

  log('INFO', `  [NEW] Created FRO-${issue.issueNumber || issue.identifier} for ${step} (workflow: ${workflowId})`);
  
  // Add to cache to prevent duplicates in this run
  allIssues.push(issue);
  
  return issue;
}

function getStepGuidance(step, calendarItem) {
  const kw = calendarItem.target_keyword || '';
  
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
    log('INFO', `  [SKIP] ${agentType} is handled by Hermes blog pipeline — not assigning in Paperclip`);
    return;
  }

  log('INFO', `  [DISPATCH] Assigning ${agentType} (${agentId}) to FRO-${issue.issueNumber || issue.identifier}`);

  // Try to assign via issue update
  try {
    await paperclipPatch(`/api/issues/${issue.id}`, {
      assigneeAgentId: agentId,
    });
    log('INFO', `  [OK] Assigned FRO-${issue.issueNumber || issue.identifier} to ${agentType}`);
  } catch (e) {
    log('WARN', `  Could not assign: ${e.message.slice(0, 100)}`);
    log('INFO', `  Agent ${agentType} should pick up FRO-${issue.issueNumber || issue.identifier} from their queue`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  log('INFO', `\n🚀 Content Pipeline Dispatch${dryRun ? ' [DRY RUN]' : ''} — ${new Date().toISOString()}\n`);

  // 1. Get overdue steps
  let overdueSteps;
  try {
    overdueSteps = await getOverdueSteps();
  } catch (err) {
    log('ERROR', `Failed to fetch overdue steps: ${err.message}`);
    return;
  }
  
  log('INFO', `📋 Found ${overdueSteps.length} overdue/in-progress steps\n`);

  if (!overdueSteps.length) {
    log('INFO', '✅ Nothing to dispatch. All caught up.');
    return;
  }

  // 2. Load cache of all existing issues (for deduplication)
  if (!dryRun) {
    await loadExistingIssuesCache();
  }

  // 3. For each overdue step, dispatch the right agent
  const dispatched = [];
  const skipped = [];
  
  for (const step of overdueSteps) {
    log('INFO', `\nProcessing: ${step.title} | ${step.step_name} (due: ${step.due_date})`);
    
    if (dryRun) {
      log('INFO', '  [DRY RUN] Would dispatch...');
      continue;
    }

    try {
      const agentType = STEP_AGENT[step.step_name] || null;
      const issue = await findOrCreateIssue(step, step.step_name, WORKFLOW_STEPS.indexOf(step.step_name));
      
      // Track if this was newly created or already existed
      const isNew = dispatched.find(d => d.issue.id === issue.id) === undefined;
      
      // Only dispatch if there's an agent to handle it (not Hermes-handled steps)
      if (agentType) {
        await dispatchAgent(issue, agentType);
      }

      dispatched.push({ step, issue, agentType });
    } catch (err) {
      log('ERROR', `  [ERROR] ${err.message}`);
    }
  }

  log('INFO', `\n${'='.repeat(60)}`);
  log('INFO', `Dispatched: ${dispatched.length} step(s)`);
  if (!dryRun) {
    log('INFO', 'Agents should now be picking up tasks from Paperclip dashboard.');
    log('INFO', 'Check: http://127.0.0.1:18789 (OpenClaw Control UI)');
  }
}

main().catch(err => {
  log('ERROR', 'Fatal:', err);
  process.exit(1);
});
