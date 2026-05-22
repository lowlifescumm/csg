'use client';
const logger = require('../../../lib/logger');

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Calendar, Plus, ChevronLeft, ChevronRight,
  CheckCircle, Circle, Clock, Edit, AlertTriangle,
  BarChart3, Target, Eye, TrendingUp, CalendarDays,
  ArrowLeft, RefreshCw, Wifi, WifiOff, Zap, X
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

const WORKFLOW_STEPS = [
  { key: 'research',       label: 'Research',      color: 'bg-blue-500' },
  { key: 'outline',        label: 'Outline',       color: 'bg-indigo-500' },
  { key: 'draft',          label: 'Draft',         color: 'bg-purple-500' },
  { key: 'edit',           label: 'Edit',         color: 'bg-pink-500' },
  { key: 'seo_review',     label: 'SEO Review',    color: 'bg-orange-500' },
  { key: 'images',         label: 'Images',       color: 'bg-cyan-500' },
  { key: 'schedule',       label: 'Schedule',     color: 'bg-teal-500' },
  { key: 'publish',        label: 'Publish',      color: 'bg-green-500' },
  { key: 'promote',        label: 'Promote',      color: 'bg-rose-500' },
];

function StepStatusBadge({ step, status }) {
  const icons = {
    completed: <CheckCircle className="w-3.5 h-3.5 text-white" />,
    in_progress: <Clock className="w-3.5 h-3.5 text-white animate-pulse" />,
    blocked: <AlertTriangle className="w-3.5 h-3.5 text-white" />,
    pending: <Circle className="w-3.5 h-3.5 text-white/40" />,
  };
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${step.color} ${status === 'completed' ? '' : status === 'blocked' ? 'ring-2 ring-red-400 ring-offset-1' : ''} transition-all`}>
      {icons[status] || icons.pending}
      <span className={status === 'pending' ? 'opacity-50' : ''}>{step.label}</span>
    </div>
  );
}

function StatusLight({ status }) {
  const map = {
    published:  'bg-green-500 shadow-green-500/50',
    scheduled:  'bg-blue-400 shadow-blue-400/50',
    writing:    'bg-yellow-400 shadow-yellow-400/50 animate-pulse',
    editing:    'bg-purple-400 shadow-purple-400/50 animate-pulse',
    planned:    'bg-gray-300 shadow-gray-300/50',
    in_progress:'bg-yellow-400 shadow-yellow-400/50 animate-pulse',
    blocked:    'bg-red-500 shadow-red-500/50',
    completed:  'bg-green-500 shadow-green-500/50',
    idle:       'bg-gray-400 shadow-gray-400/50',
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status] || map.idle} shadow-md`} />
  );
}

function WorkflowPanel({ item, onClose }) {
  const steps = item.workflow_steps || [];
  const stepMap = {};
  steps.forEach(s => { stepMap[s.step_name] = s; });

  // Calculate overall health
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const blockedSteps = steps.filter(s => s.status === 'blocked');
  const inProgressSteps = steps.filter(s => s.status === 'in_progress');
  const overdueSteps = steps.filter(s => {
    if (!s.due_date || s.status === 'completed') return false;
    return new Date(s.due_date) < new Date();
  });

  const health = blockedSteps.length > 0 ? 'blocked'
    : overdueSteps.length > 0 ? 'overdue'
    : inProgressSteps.length > 0 ? 'active'
    : completedCount > 0 ? 'partial'
    : 'not_started';

  const healthConfig = {
    blocked:   { label: '🔴 Blocked',   desc: `${blockedSteps.length} step(s) need attention`,   color: 'bg-red-50 border-red-200' },
    overdue:   { label: '🟡 Overdue',   desc: `${overdueSteps.length} step(s) past due date`,     color: 'bg-yellow-50 border-yellow-200' },
    active:    { label: '🟡 In Progress', desc: `${inProgressSteps.length} step(s) being worked`,  color: 'bg-blue-50 border-blue-200' },
    partial:   { label: '🟢 Partial',    desc: `${completedCount}/${steps.length} steps done`,    color: 'bg-green-50 border-green-200' },
    not_started:{ label: '⚪ Not Started', desc: 'Work not yet begun',                           color: 'bg-gray-50 border-gray-200' },
  };

  const hc = healthConfig[health];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusLight status={item.status} />
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                item.status === 'published' ? 'bg-green-100 text-green-800 border-green-200' :
                item.status === 'scheduled' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                item.status === 'writing' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-gray-100 text-gray-800 border-gray-200'
              }`}>{item.status}</span>
              <span className="text-xs text-gray-400">#{item.id}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Target: <span className="text-purple-600 font-medium">{item.target_keyword}</span>
              {item.target_url_slug && <span className="text-gray-400"> /{item.target_url_slug}</span>}
              {item.publish_date && (
                <span className="ml-3">📅 {new Date(item.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Health Banner */}
        <div className={`mx-6 mt-4 rounded-xl border px-4 py-3 ${hc.color}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{hc.label}</p>
              <p className="text-sm text-gray-600">{hc.desc}</p>
            </div>
            {blockedSteps.length > 0 && (
              <AlertTriangle className="w-6 h-6 text-red-500" />
            )}
          </div>
        </div>

        {/* Blockers */}
        {blockedSteps.length > 0 && (
          <div className="mx-6 mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-1">⚠️ Blockers</p>
            {blockedSteps.map((s, i) => (
              <p key={i} className="text-sm text-red-800">
                <span className="font-medium capitalize">{s.step_name.replace(/_/g, ' ')}:</span>{' '}
                {s.hold_reason || 'Unknown issue — check Paperclip agent logs'}
              </p>
            ))}
          </div>
        )}

        {/* Overdue */}
        {overdueSteps.length > 0 && (
          <div className="mx-6 mt-3 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3">
            <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide mb-1">⏰ Overdue</p>
            {overdueSteps.map((s, i) => (
              <p key={i} className="text-sm text-yellow-800">
                <span className="font-medium capitalize">{s.step_name.replace(/_/g, ' ')}</span>
                {' '}— was due {new Date(s.due_date).toLocaleDateString()}
              </p>
            ))}
          </div>
        )}

        {/* Agent Activity */}
        {item.current_agent && (
          <div className="mx-6 mt-3 rounded-xl bg-purple-50 border border-purple-200 px-4 py-3">
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide mb-1">🤖 Agent</p>
            <p className="text-sm text-purple-900 font-medium">{item.current_agent}</p>
          </div>
        )}

        {/* Notes */}
        {item.notes && (
          <div className="mx-6 mt-3 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📝 Notes</p>
            <p className="text-sm text-gray-700">{item.notes}</p>
          </div>
        )}

        {/* Full Workflow Steps */}
        <div className="px-6 py-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Full Workflow</p>
          <div className="space-y-2">
            {WORKFLOW_STEPS.map((step, idx) => {
              const dbStep = stepMap[step.key];
              const status = dbStep?.status || 'pending';
              const isOverdue = dbStep?.due_date && new Date(dbStep.due_date) < new Date() && status !== 'completed';
              
              return (
                <div key={step.key} className="flex items-center gap-3">
                  {/* Connector line */}
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <div className={`absolute left-[22px] w-0.5 h-5 -mt-5 ${status === 'completed' ? 'bg-green-400' : 'bg-gray-200'}`} style={{ marginTop: '-2px' }} />
                  )}
                  {/* Step circle */}
                  <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${step.color} ${status === 'completed' ? '' : status === 'in_progress' ? 'ring-4 ring-offset-1 ring-yellow-300' : status === 'blocked' ? 'ring-4 ring-offset-1 ring-red-300' : ''}`}>
                    {status === 'completed' ? '✓' : idx + 1}
                  </div>
                  {/* Step content */}
                  <div className={`flex-1 flex items-center justify-between py-1.5 px-3 rounded-lg border ${isOverdue ? 'border-yellow-300 bg-yellow-50' : status === 'blocked' ? 'border-red-200 bg-red-50' : status === 'in_progress' ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                    <div>
                      <span className={`text-sm font-medium ${status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{step.label}</span>
                      {dbStep?.due_date && (
                        <span className={`ml-2 text-xs ${isOverdue ? 'text-yellow-700 font-medium' : 'text-gray-400'}`}>
                          Due {new Date(dbStep.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      {status === 'blocked' && dbStep?.hold_reason && (
                        <p className="text-xs text-red-600 mt-0.5">{dbStep.hold_reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {status === 'in_progress' && <span className="text-xs text-blue-600 font-medium animate-pulse">Working...</span>}
                      {status === 'completed' && dbStep?.completed_at && (
                        <span className="text-xs text-green-600">Done {new Date(dbStep.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      )}
                      {isOverdue && <Clock className="w-3.5 h-3.5 text-yellow-500" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-6 py-3 flex items-center justify-between rounded-b-2xl">
          <Link
            href={item.post_id ? `/admin/blog/${item.post_id}/edit` : '/admin'}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            {item.post_id ? 'Edit Blog Post' : 'No post yet'}
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function CalendarCard({ item, onClick, isSelected }) {
  const steps = item.workflow_steps || [];
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const inProgressCount = steps.filter(s => s.status === 'in_progress').length;
  const blockedCount = steps.filter(s => s.status === 'blocked').length;
  
  const health = blockedCount > 0 ? '🔴' : inProgressCount > 0 ? '🟡' : completedCount > 0 ? '🟢' : '⚪';

  const statusColors = {
    published:  'bg-green-50 border-green-200',
    scheduled:   'bg-blue-50 border-blue-200',
    writing:     'bg-yellow-50 border-yellow-200',
    editing:     'bg-purple-50 border-purple-200',
    planned:     'bg-gray-50 border-gray-200',
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${isSelected ? 'ring-2 ring-purple-400 shadow-lg' : ''} ${statusColors[item.status] || statusColors.planned}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusLight status={item.status} />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            item.priority === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
            item.priority === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
            'bg-gray-50 text-gray-600 border-gray-200'
          }`}>{item.priority} · {item.status}</span>
          <span className="text-xs text-gray-400">#{item.id}</span>
        </div>
        <span className="text-lg">{health}</span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-1 leading-snug">{item.title}</h3>
      <p className="text-xs text-purple-600 font-medium mb-3">→ {item.target_keyword}</p>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Workflow</span>
          <span>{completedCount}/{steps.length} steps</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${steps.length > 0 ? (completedCount / steps.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Mini step indicators */}
      <div className="flex flex-wrap gap-1">
        {WORKFLOW_STEPS.map(step => {
          const dbStep = steps.find(s => s.step_name === step.key);
          const s = dbStep?.status || 'pending';
          return (
            <div key={step.key} className={`w-4 h-4 rounded-sm flex items-center justify-center ${step.color} ${s === 'completed' ? 'opacity-100' : s === 'in_progress' ? 'opacity-80 ring-1 ring-yellow-400' : s === 'blocked' ? 'opacity-100 ring-1 ring-red-400' : 'opacity-30'}`}>
              {s === 'completed' ? <CheckCircle className="w-3 h-3 text-white" /> :
               s === 'in_progress' ? <Clock className="w-3 h-3 text-white animate-pulse" /> :
               s === 'blocked' ? <AlertTriangle className="w-3 h-3 text-white" /> :
               <Circle className="w-3 h-3 text-white" />}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200/50">
        <span className="text-xs text-gray-400">
          {item.publish_date ? new Date(item.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
        </span>
        {blockedCount > 0 && (
          <span className="text-xs text-red-600 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {blockedCount} blocked
          </span>
        )}
        {inProgressCount > 0 && (
          <span className="text-xs text-blue-600 font-medium flex items-center gap-1 animate-pulse">
            <Zap className="w-3 h-3" /> {inProgressCount} active
          </span>
        )}
        {completedCount === steps.length && steps.length > 0 && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Done
          </span>
        )}
      </div>
    </div>
  );
}

export default function ContentCalendarPage() {
  const [calendar, setCalendar] = useState([]);
  const [paperclipStatus, setPaperclipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPoll, setLastPoll] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchUser = async () => {
    try {
      const data = await apiClient.get('/api/auth/user');
      setUser(data.user);
      if (data.user.role !== 'admin') {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const fetchPaperclipStatus = useCallback(async () => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';
      if (!apiKey) {
        console.warn('NEXT_PUBLIC_ADMIN_API_KEY not set');
        return;
      }
      const data = await apiClient.get(`/api/paperclip/status`, {
        headers: { 'x-api-key': apiKey },
      });
      setPaperclipStatus(data);
      if (data.calendar) {
        setCalendar(prev => {
          const merged = [...prev];
          for (const newItem of data.calendar) {
            const idx = merged.findIndex(c => c.id === newItem.id);
            if (idx >= 0) {
              const existingSteps = merged[idx].workflow_steps || [];
              const newSteps = newItem.workflow_steps || [];
              const stepMap = {};
              [...existingSteps, ...newSteps].forEach(s => { stepMap[s.step_name] = s; });
              merged[idx] = { ...merged[idx], ...newItem, workflow_steps: Object.values(stepMap) };
            } else {
              merged.push(newItem);
            }
          }
          return merged;
        });
      }
      setLastPoll(new Date());
      setIsConnected(true);
    } catch (err) {
      console.error("[admin/content-calendar] Polling error:", err);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    fetchPaperclipStatus();
    const interval = setInterval(fetchPaperclipStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchPaperclipStatus]);

  // Merge paperclip status data into calendar items
  const enrichedCalendar = calendar.map(item => {
    const agentData = paperclipStatus?.agent_status;
    const froIssues = paperclipStatus?.fro_issues || [];
    
    // Try to find matching agent/issue
    const keyword = (item.target_keyword || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    
    let currentAgent = null;
    let froIssue = null;
    
    for (const issue of froIssues) {
      const issueTitle = (issue.title || '').toLowerCase();
      if (issueTitle.includes(keyword) || keyword.includes(issueTitle.slice(0, 20))) {
        froIssue = issue;
        if (issue.assignee) currentAgent = issue.assignee;
        break;
      }
    }

    // Check active agent runs
    const activeRuns = agentData?.active_runs || [];
    for (const run of activeRuns) {
      const taskPreview = (run.task_preview || '').toLowerCase();
      if (taskPreview.includes(keyword) || title.some(w => w.length > 4 && taskPreview.includes(w))) {
        currentAgent = run.label || 'Agent Working';
        break;
      }
    }

    return { ...item, current_agent: currentAgent, fro_issue: froIssue };
  });

  const filteredCalendar = enrichedCalendar.filter(item => {
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    if (selectedMonth && item.month_number !== selectedMonth) return false;
    return true;
  });

  const publishedCount = calendar.filter(i => i.status === 'published').length;
  const scheduledCount = calendar.filter(i => i.status === 'scheduled').length;
  const inProgressCount = calendar.filter(i => ['writing', 'editing'].includes(i.status)).length;
  const blockedCount = calendar.filter(i => (i.workflow_steps || []).some(s => s.status === 'blocked')).length;
  const totalCount = calendar.length;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-500 hover:text-purple-600 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
                  {/* Live indicator */}
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {isConnected ? 'Live' : 'Offline'}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {totalCount} items · {publishedCount} published · {inProgressCount} in progress · {blockedCount} blocked
                  {lastPoll && <span className="ml-2 text-gray-400">· Updated {lastPoll.toLocaleTimeString()}</span>}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPaperclipStatus}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition-colors"
                title="Refresh now"
              >
                <RefreshCw className={`w-4 h-4 ${isConnected ? '' : 'animate-spin'}`} />
                Refresh
              </button>
              <div className="flex bg-gray-100 rounded-xl p-1">
                {['calendar', 'workflow', 'performance'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      activeTab === tab 
                        ? 'bg-white text-purple-600 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Agent Activity Bar (when agents are running) */}
        {paperclipStatus?.agent_status?.active_runs?.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl px-5 py-3 flex items-center gap-4 shadow-lg">
            <div className="flex items-center gap-2 text-white/90">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">Agents Running:</span>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {paperclipStatus.agent_status.active_runs.map((run, i) => (
                <span key={i} className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-medium whitespace-nowrap">
                  {run.label || 'Unnamed'} · {run.task_preview?.slice(0, 40)}...
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Blockers Banner */}
        {blockedCount > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl px-5 py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-800">
              <strong>{blockedCount} item(s)</strong> have blocked workflow steps that need your attention.
              Click on them below to see what's stuck.
            </p>
            <button 
              onClick={() => setFilterStatus('blocked')}
              className="ml-auto px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
            >
              Show blocked
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === 'all' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setFilterStatus('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === 'published' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            Published ({publishedCount})
          </button>
          <button
            onClick={() => setFilterStatus('scheduled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === 'scheduled' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            Scheduled ({scheduledCount})
          </button>
          <button
            onClick={() => setFilterStatus('writing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === 'writing' ? 'bg-yellow-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setFilterStatus('planned')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${filterStatus === 'planned' ? 'bg-gray-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
          >
            Planned ({totalCount - publishedCount - scheduledCount - inProgressCount})
          </button>
        </div>

        {/* Calendar Grid */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCalendar.length === 0 ? (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No items match your filter.</p>
              </div>
            ) : (
              filteredCalendar.map(item => (
                <CalendarCard
                  key={item.id}
                  item={item}
                  onClick={() => setSelectedItem(item)}
                  isSelected={selectedItem?.id === item.id}
                />
              ))
            )}
          </div>
        )}

        {/* Workflow Overview Tab */}
        {activeTab === 'workflow' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500">
              <h2 className="text-lg font-semibold text-white">Publishing Pipeline Health</h2>
              <p className="text-white/80 text-sm">Across all {totalCount} items in the calendar</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                  { label: 'Total Items', value: totalCount, color: 'text-gray-900', bg: 'bg-gray-100' },
                  { label: 'Published', value: publishedCount, color: 'text-green-600', bg: 'bg-green-100' },
                  { label: 'Scheduled', value: scheduledCount, color: 'text-blue-600', bg: 'bg-blue-100' },
                  { label: 'In Progress', value: inProgressCount, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                  { label: 'Blocked', value: blockedCount, color: 'text-red-600', bg: 'bg-red-100' },
                ].map(stat => (
                  <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Step-by-step overview */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Step Completion</p>
              <div className="space-y-3">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const totalWithStep = filteredCalendar.filter(item =>
                    (item.workflow_steps || []).some(s => s.step_name === step.key)
                  ).length;
                  const completed = filteredCalendar.filter(item =>
                    (item.workflow_steps || []).some(s => s.step_name === step.key && s.status === 'completed')
                  ).length;
                  const pct = totalWithStep > 0 ? Math.round((completed / totalWithStep) * 100) : 0;
                  
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${step.color} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{step.label}</span>
                          <span className="text-xs text-gray-500">{completed}/{totalWithStep} ({pct}%)</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${step.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              Performance Tracking
            </h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
              <p className="font-medium mb-2">📊 Performance data requires GA4 integration.</p>
              <p>To track organic sessions and email signups per post, connect Google Analytics 4 to the site and ensure UTM parameters are added to all social links.</p>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Detail Panel */}
      {selectedItem && (
        <WorkflowPanel
          item={enrichedCalendar.find(i => i.id === selectedItem.id) || selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
