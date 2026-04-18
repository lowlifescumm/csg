'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Circle,
  Clock,
  Edit,
  BarChart3,
  Target,
  Eye,
  TrendingUp,
  CalendarDays,
  ArrowLeft
} from 'lucide-react';

export default function ContentCalendarPage() {
  const [calendar, setCalendar] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar'); // calendar, workflow, performance

  useEffect(() => {
    fetchUser();
    fetchCalendar();
    fetchSummary();
  }, [selectedMonth]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/user');
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        if (data.user.role !== 'admin') {
          window.location.href = '/dashboard';
        }
      } else {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  const fetchCalendar = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMonth) params.append('month', selectedMonth);
      
      const response = await fetch(`/api/content-calendar?${params.toString()}`);
      const data = await response.json();
      setCalendar(data.calendar || []);
    } catch (error) {
      console.error('Failed to fetch calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/content-performance?summary=true');
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'writing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'editing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'planned': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getWorkflowStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <Circle className="w-4 h-4 text-gray-300" />;
    }
  };

  const groupByMonth = () => {
    const grouped = {};
    calendar.forEach(item => {
      const month = item.month_number || 1;
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(item);
    });
    return grouped;
  };

  const monthNames = ['', 'May 2026', 'June 2026', 'July 2026'];
  const groupedCalendar = groupByMonth();

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
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-purple-600 transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
                <p className="text-gray-600">3-month publishing plan (24 posts)</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-xl p-1">
                {['calendar', 'workflow', 'performance'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                      activeTab === tab 
                        ? 'bg-white text-purple-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        {summary?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planned Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.summary.total_planned}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">{summary.summary.total_published}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{summary.summary.in_writing + summary.summary.scheduled}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Sessions</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {parseInt(summary.summary.total_organic_sessions).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {activeTab === 'calendar' && (
          <div className="space-y-8">
            {/* Month Filter */}
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedMonth(null)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedMonth === null 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Months
              </button>
              {[1, 2, 3].map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedMonth === month 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {monthNames[month]}
                </button>
              ))}
            </div>

            {/* Calendar Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              Object.entries(groupedCalendar).map(([month, items]) => (
                <div key={month} className="glassmorphic rounded-2xl apple-shadow-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/20 bg-gradient-to-r from-purple-500 to-pink-500">
                    <h2 className="text-xl font-semibold text-white">
                      Month {month}: {monthNames[parseInt(month)]}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {items.length} posts scheduled • {items.filter(i => i.status === 'published').length} published
                    </p>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                {item.status}
                              </span>
                              <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                                {item.priority.toUpperCase()} PRIORITY
                              </span>
                              <span className="text-gray-400 text-sm">
                                Week {item.week_number}
                              </span>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {item.title}
                            </h3>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Target className="w-4 h-4" />
                                <span>Target: <strong className="text-purple-600">{item.target_keyword}</strong></span>
                              </span>
                              {item.target_url_slug && (
                                <span className="flex items-center space-x-1">
                                  <Eye className="w-4 h-4" />
                                  <span>/{item.target_url_slug}</span>
                                </span>
                              )}
                              {item.publish_date && (
                                <span className="flex items-center space-x-1">
                                  <CalendarDays className="w-4 h-4" />
                                  <span>{new Date(item.publish_date).toLocaleDateString()}</span>
                                </span>
                              )}
                            </div>

                            {item.notes && (
                              <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                {item.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Link
                              href={`/admin/blog/${item.post_id}/edit`}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Edit Post"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                          </div>
                        </div>

                        {/* Workflow Steps Preview */}
                        {item.workflow_steps && item.workflow_steps.length > 0 && (
                          <div className="mt-4 flex items-center space-x-4 overflow-x-auto">
                            {item.workflow_steps.slice(0, 5).map((step, idx) => (
                              <div key={idx} className="flex items-center space-x-1 text-xs text-gray-500">
                                {getWorkflowStatusIcon(step.status)}
                                <span className="capitalize">{step.step_name.replace(/_/g, ' ')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Workflow View */}
        {activeTab === 'workflow' && (
          <div className="glassmorphic rounded-2xl apple-shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Publishing Workflow</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-9 gap-4">
              {['Research', 'Outline', 'Draft', 'Edit', 'SEO Review', 'Images', 'Schedule', 'Publish', 'Promote'].map((step, idx) => {
                const completed = calendar.filter(item => 
                  item.workflow_steps?.some(s => s.step_name === step.toLowerCase().replace(/ /g, '_') && s.status === 'completed')
                ).length;
                const total = calendar.length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                return (
                  <div key={step} className="text-center">
                    <div className="relative mb-2">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-sm font-bold ${
                        percentage === 100 ? 'bg-green-500 text-white' : 
                        percentage > 0 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>
                      {idx < 8 && (
                        <div className="absolute top-1/2 left-full w-full h-0.5 bg-gray-200 -translate-y-1/2" style={{ width: 'calc(100% - 48px)' }}></div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-700 mb-1">{step}</p>
                    <p className="text-xs text-gray-500">{completed}/{total}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance View */}
        {activeTab === 'performance' && summary?.topPerformingPosts && (
          <div className="space-y-6">
            <div className="glassmorphic rounded-2xl apple-shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Top Performing Posts
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Post</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Target Keyword</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Organic Sessions</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Email Signups</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.topPerformingPosts.map((post, idx) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{post.title}</p>
                          <p className="text-sm text-gray-500">
                            Published {post.publish_date ? new Date(post.publish_date).toLocaleDateString() : 'N/A'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-purple-600 font-medium">{post.target_keyword}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold">{parseInt(post.total_sessions).toLocaleString()}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-semibold text-green-600">+{post.total_signups}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Performance Tracking Instructions */}
            <div className="glassmorphic rounded-2xl apple-shadow-lg p-6 bg-gradient-to-r from-blue-50 to-purple-50">
              <h3 className="font-semibold text-gray-900 mb-2">Tracking Setup</h3>
              <p className="text-sm text-gray-600 mb-4">
                To track organic traffic and signups per post, ensure these are configured:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Google Analytics 4 is installed on all pages</li>
                <li>UTM parameters are added to social/promotional links</li>
                <li>Email signup events are tracked as conversions</li>
                <li>Weekly performance reports are automated (see /scripts/content-performance.js)</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
