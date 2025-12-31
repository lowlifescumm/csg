'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Calendar, DollarSign, User, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function AdvisorReviewPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(null); // Track which application is being processed

  useEffect(() => {
    fetchUser();
    fetchApplications();
  }, []);

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
      window.location.href = '/login';
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/admin/advisors/pending');
      const data = await response.json();
      if (response.ok) {
        setApplications(data.applications || []);
      } else {
        setError(data.error || 'Failed to fetch applications');
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/admin/login';
        }
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRate = (rate) => {
    if (!rate) return 'Not set';
    return `$${parseFloat(rate).toFixed(2)}/min`;
  };

  const handleStatusUpdate = async (advisorUserId, status) => {
    try {
      setProcessing(advisorUserId);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/admin/advisors/${advisorUserId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(`Application ${status.toLowerCase()} successfully`);
        // Remove the processed application from the list
        setApplications(prev => prev.filter(app => app.user_id !== advisorUserId));
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || `Failed to ${status.toLowerCase()} application`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to connect to server');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = (advisorUserId) => {
    handleStatusUpdate(advisorUserId, 'APPROVED');
  };

  const handleReject = (advisorUserId) => {
    if (confirm('Are you sure you want to reject this advisor application?')) {
      handleStatusUpdate(advisorUserId, 'REJECTED');
    }
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Advisor Review Queue</h1>
                <p className="text-gray-600">Review pending advisor applications</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Applications</p>
                <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            {error}
          </div>
        )}

        {/* Applications List */}
        {loading ? (
          <div className="glassmorphic rounded-2xl p-8 apple-shadow-lg">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="glassmorphic rounded-2xl p-12 apple-shadow-lg text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Pending Applications</h3>
            <p className="text-gray-600">There are no pending advisor applications at this time.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app) => (
              <div key={app.id} className="glassmorphic rounded-2xl p-6 apple-shadow-lg border border-white border-opacity-40">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {app.user_name || app.user_email}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          <span>{app.user_email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Applied {formatDate(app.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Requested Rate</div>
                      <div className="text-xl font-bold text-purple-600 flex items-center gap-1">
                        <DollarSign className="w-5 h-5" />
                        {formatRate(app.per_minute_rate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Bio</h4>
                  <div className="bg-white bg-opacity-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{app.bio || 'No bio provided'}</p>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {app.specialties && app.specialties.length > 0 ? (
                      app.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1.5 bg-purple-100 border border-purple-300 rounded-full text-sm font-medium text-purple-900"
                        >
                          {specialty}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">No specialties selected</span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleReject(app.user_id)}
                    disabled={processing === app.user_id}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === app.user_id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        Reject
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApprove(app.user_id)}
                    disabled={processing === app.user_id}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === app.user_id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

