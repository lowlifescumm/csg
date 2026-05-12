/**
 * GET /api/paperclip/status
 * 
 * Returns real-time agent activity mapped to calendar workflow steps.
 * Reads:
 *   - Paperclip subagent runs.json (active + recent completions)
 *   - FRO issues API (issue status, assignee, blocker info)
 * 
 * Auth: x-api-key = BLOG_API_KEY
 */

import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { cookies } from 'next/headers';

const FRO_API_KEY = process.env.FRO_API_KEY;
const FRO_COMPANY_ID = '84898c57-acb2-43a9-a0e7-b22d600d3434';

if (!FRO_API_KEY) {
  throw new Error('FRO_API_KEY environment variable is required for /api/paperclip/status');
}
const SUBAGENT_RUNS_FILE = '/home/ethan/.openclaw/subagents/runs.json';
const PAPERCLIP_API = `https://paperclip.in/api/company/${FRO_COMPANY_ID}`;

// ─── FRO API ────────────────────────────────────────────────────────────────

async function fetchFRO(endpoint) {
  try {
    const res = await fetch(`${PAPERCLIP_API}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${FRO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getFROIssues() {
  const data = await fetchFRO('/issues?limit=50');
  if (!data?.items) return {};
  return data.items.reduce((acc, issue) => {
    acc[issue.public_id] = issue;
    return acc;
  }, {});
}

async function getFROAgents() {
  const data = await fetchFRO('/agents');
  if (!data?.agents) return {};
  return data.agents.reduce((acc, agent) => {
    acc[agent.id] = agent;
    return acc;
  }, {});
}

async function getActiveRuns() {
  try {
    const fs = await import('fs');
    if (!fs.existsSync(SUBAGENT_RUNS_FILE)) return { active: [], recent: [] };
    
    const content = fs.readFileSync(SUBAGENT_RUNS_FILE, 'utf8');
    const allRuns = JSON.parse(content);
    
    // Runs are stored as numeric-indexed object
    const runs = Object.values(allRuns)
      .flat()
      .filter(Boolean)
      .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0));
    
    const now = Date.now();
    const active = runs.filter(r => !r.endedAt || (now - r.endedAt) < 5 * 60 * 1000);
    const recent = runs.filter(r => r.endedAt && (now - r.endedAt) < 60 * 60 * 1000);
    
    return { active, recent };
  } catch {
    return { active: [], recent: [] };
  }
}

// ─── Calendar → Agent Mapping ──────────────────────────────────────────────
// Keywords that link a calendar item to a Paperclip content pipeline issue

const CONTENT_KEYWORDS = {
  'birth chart calculator': ['fro-57', 'content-writer', 'seo-strategist'],
  'birth chart': ['fro-57', 'content-writer', 'seo-strategist'],
  'tarot': ['fro-61', 'content-writer'],
  'tower card': ['fro-61', 'content-writer'],
  'horoscope': ['fro-62', 'content-writer'],
  'compatibility': ['fro-63', 'content-writer'],
  'love': ['fro-63', 'content-writer'],
  'instagram': ['fro-58', 'social-media-manager'],
  'pinterest': ['fro-59', 'social-media-manager'],
  'tiktok': ['fro-60', 'social-media-manager'],
};

function inferAgentType(calendarItem) {
  const title = (calendarItem.title || '').toLowerCase();
  const keyword = (calendarItem.target_keyword || '').toLowerCase();
  const combined = title + ' ' + keyword;
  
  for (const [kw, agents] of Object.entries(CONTENT_KEYWORDS)) {
    if (combined.includes(kw)) return agents;
  }
  return null;
}

function getStepNameForStatus(agentType, stepIndex) {
  // Maps agent type to which workflow step it's working on
  const stepMap = {
    'content-writer': ['research', 'outline', 'draft', 'edit', 'seo_review'],
    'seo-strategist': ['seo_review'],
    'social-media-manager': ['draft', 'edit', 'images', 'schedule', 'promote'],
  };
  const steps = stepMap[agentType] || ['draft'];
  return steps[Math.min(stepIndex, steps.length - 1)] || 'draft';
}

// ─── Build Unified Status ───────────────────────────────────────────────────

export async function GET(request) {
  // Auth check
  const apiKey = request.headers.get('x-api-key');
  const blogApiKey = process.env.BLOG_API_KEY;
  if (!apiKey || apiKey !== blogApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [froIssues, froAgents, { active: activeRuns, recent: recentRuns }, calendarRows] = await Promise.all([
      getFROIssues(),
      getFROAgents(),
      getActiveRuns(),
      pool.query(`
        SELECT cc.id, cc.title, cc.target_keyword, cc.status as calendar_status,
               cc.assigned_to, cc.post_id,
               pw.id as workflow_id, pw.step_name, pw.status as step_status, pw.due_date,
               pw.completed_at
        FROM content_calendar cc
        LEFT JOIN publishing_workflow pw ON pw.calendar_id = cc.id
        WHERE cc.status != 'published'
        ORDER BY cc.publish_date ASC, pw.due_date ASC
      `),
    ]);

    // Build issue-ID → FRO issue map
    const froByPublicId = Object.fromEntries(
      Object.entries(froIssues).map(([k, v]) => [v.public_id, v])
    );

    // ── Map agent runs to calendar items ──────────────────────────────────
    const CAL_STEP_COLORS = {
      research: 0,
      outline: 1,
      draft: 2,
      edit: 3,
      seo_review: 4,
      images: 5,
      schedule: 6,
      publish: 7,
      promote: 8,
    };

    const updates = []; // DB updates to apply
    const calendarWorkflowMap = {}; // calendar_id → step_name → DB row

    // Group DB rows by calendar_id
    for (const row of calendarRows.rows) {
      if (!calendarWorkflowMap[row.id]) calendarWorkflowMap[row.id] = {};
      if (row.step_name) {
        calendarWorkflowMap[row.id][row.step_name] = row;
      }
    }

    // Process recent runs to infer status changes
    for (const run of [...activeRuns, ...recentRuns]) {
      const label = run.label || '';
      const froMatch = label.match(/fro-\d+/i);
      const froPublicId = froMatch ? froMatch[0].toUpperCase() : null;
      const froIssue = froPublicId ? froByPublicId[froPublicId] : null;
      
      if (!froIssue) continue;

      // Find matching calendar items by keyword
      const froTitle = (froIssue.title || '').toLowerCase();
      const froKeywords = froIssue.labels || [];
      
      for (const [calId, steps] of Object.entries(calendarWorkflowMap)) {
        const cal = calendarRows.rows.find(r => r.id == calId);
        if (!cal) continue;
        
        const calTitle = (cal.title || '').toLowerCase();
        const calKeyword = (cal.target_keyword || '').toLowerCase();
        const combined = calTitle + ' ' + calKeyword;
        
        // Check keyword match
        let matched = froKeywords.some(kw => combined.includes(kw.toLowerCase())) ||
                      froKeywords.some(kw => kw.toLowerCase().includes(calKeyword));
        
        // Also check title word overlap
        if (!matched) {
          const froWords = froTitle.split(/\s+/).filter(w => w.length > 4);
          matched = froWords.some(w => calKeyword.includes(w) || calTitle.includes(w));
        }
        
        if (!matched) continue;

        // Determine step status from run
        const isActive = activeRuns.includes(run);
        const agentType = inferAgentType(cal) || 'content-writer';
        const stepOrder = CAL_STEP_COLORS[agentType] || 2;

        // Figure out which step the agent is working on based on run progress
        let targetStep = null;
        let targetStatus = 'pending';

        if (isActive) {
          targetStatus = 'in_progress';
          // Infer which step based on label + time
          const stepNames = ['research', 'outline', 'draft', 'edit', 'seo_review', 'images', 'schedule', 'promote'];
          targetStep = stepNames[stepOrder] || 'draft';
        } else if (run.outcome?.status === 'ok') {
          targetStatus = 'completed';
          targetStep = stepNames[stepOrder] || 'draft';
        } else if (run.outcome?.status === 'error') {
          targetStatus = 'blocked';
          targetStep = stepNames[stepOrder] || 'draft';
        }

        if (targetStep && steps[targetStep]) {
          updates.push({
            workflow_id: steps[targetStep].workflow_id,
            step_status: targetStatus,
            step_name: targetStep,
          });
        }
      }
    }

    // Apply DB updates
    for (const upd of updates) {
      await pool.query(`
        UPDATE publishing_workflow
        SET status = $1,
            completed_at = CASE WHEN $1 = 'completed' THEN NOW() ELSE completed_at END
        WHERE id = $2
      `, [upd.step_status, upd.workflow_id]);
    }

    // Fetch updated calendar with new workflow states
    const updatedCalendar = await pool.query(`
      SELECT 
        cc.*,
        bp.id as actual_post_id,
        bp.status as post_status,
        bp.published_at,
        COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id', pw.id,
              'step_name', pw.step_name,
              'status', pw.status,
              'due_date', pw.due_date,
              'completed_at', pw.completed_at
            ) ORDER BY pw.due_date ASC
          ) FROM publishing_workflow pw WHERE pw.calendar_id = cc.id),
          '[]'::jsonb
        ) as workflow_steps
      FROM content_calendar cc
      LEFT JOIN blog_posts bp ON cc.post_id = bp.id
      WHERE cc.status != 'published'
      ORDER BY cc.publish_date ASC
    `);

    return NextResponse.json({
      success: true,
      agent_status: {
        active_runs: activeRuns.map(r => ({
          id: r.runId,
          label: r.label,
          task_preview: (r.task || '').slice(0, 100),
          started_at: r.startedAt ? new Date(r.startedAt).toISOString() : null,
          status: 'running',
        })),
        recent_completions: recentRuns.filter(r => !activeRuns.includes(r)).slice(0, 5).map(r => ({
          id: r.runId,
          label: r.label,
          outcome: r.outcome?.status,
          ended_at: r.endedAt ? new Date(r.endedAt).toISOString() : null,
        })),
      },
      fro_issues: Object.values(froIssues).slice(0, 10).map(i => ({
        public_id: i.public_id,
        title: i.title,
        status: i.status,
        assignee: i.assignee?.name || null,
        blocker: i.blocker ? 'yes' : 'no',
      })),
      calendar: updatedCalendar.rows,
      updates_applied: updates.length,
      polled_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Paperclip status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
