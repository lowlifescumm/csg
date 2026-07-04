'use client';
const logger = require('../../../lib/logger');

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, Filter, ArrowLeft, Mail, Calendar, Crown, Shield } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [user, setUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [credits, setCredits] = useState(0);
  const [newCredits, setNewCredits] = useState('');
  const [creditError, setCreditError] = useState('');
  const [creditSuccess, setCreditSuccess] = useState('');
  const [isUpdatingCredits, setIsUpdatingCredits] = useState(false);

  useEffect(() => {
    fetchUser();
    fetchUsers();
  }, []);

  const fetchUser = async () => {
    try {
      const data = await apiClient.get('/api/auth/user');
      setUser(data.user);
      if (data.user.role !== 'admin') {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/login';
    }
  };

  const openModal = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    try {
      const data = await apiClient.get(`/api/credits?userId=${user.id}`);
      setCredits(data.credits);
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    }
  };

  const closeModal = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
    setCredits(0);
    setNewCredits('');
    setCreditError('');
    setCreditSuccess('');
  };

  const handleCreditChange = async (e) => {
    e.preventDefault();
    setCreditError('');
    setCreditSuccess('');
    setIsUpdatingCredits(true);
    
    try {
      const amount = parseInt(newCredits, 10);
      
      if (isNaN(amount)) {
        setCreditError('Please enter a valid number');
        setIsUpdatingCredits(false);
        return;
      }

      const data = await apiClient.post('/api/admin/credits', { userId: selectedUser.id, amount });
      setCreditSuccess(`${amount > 0 ? 'Added' : 'Adjusted'} ${Math.abs(amount)} credit${Math.abs(amount) !== 1 ? 's' : ''}. New balance: ${data.newBalance}`);
      setCredits(data.newBalance);
      setNewCredits('');
      setTimeout(() => {
        closeModal();
        fetchUsers(); // Refresh user list
      }, 2000);
    } catch (error) {
      console.error('Failed to update credits:', error);
      setCreditError(error.message || 'Failed to connect to server');
    } finally {
      setIsUpdatingCredits(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/admin/users');
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage user accounts and permissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Premium Users</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.stripe_subscription_id).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admin Users</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Week</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(u.created_at) > weekAgo;
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="glassmorphic rounded-2xl p-6 apple-shadow-lg mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="glassmorphic rounded-2xl apple-shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
          </div>

          {loading ? (
            <div className="p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 smooth-transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.first_name?.[0] || user.email[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}` 
                                : user.email}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.stripe_subscription_id 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.stripe_subscription_id ? 'Premium' : 'Free'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-700 smooth-transition">
                            View
                          </button>
                          <button className="text-purple-600 hover:text-purple-700 smooth-transition">
                            Edit
                          </button>
                          <button
                            onClick={() => openModal(user)}
                            className="text-green-600 hover:text-green-700 smooth-transition"
                          >
                            Adjust Credits
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 apple-shadow-lg">
            <h2 className="text-2xl font-bold mb-2 gradient-text">Adjust Credits</h2>
            <p className="text-sm text-gray-600 mb-6">{selectedUser.email}</p>
            
            <div className="mb-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl mb-4">
                <span className="text-gray-700 font-medium">Current Balance:</span>
                <span className="text-2xl font-bold text-purple-600">{credits}</span>
              </div>
            </div>

            <form onSubmit={handleCreditChange}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Adjustment Amount
                </label>
                <input
                  type="number"
                  value={newCredits}
                  onChange={(e) => {
                    setNewCredits(e.target.value);
                    setCreditError('');
                    setCreditSuccess('');
                  }}
                  placeholder="Enter amount (e.g., +50 or -20)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent smooth-transition text-gray-900"
                  required
                  disabled={isUpdatingCredits}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Use positive numbers to add credits, negative to subtract
                </p>
              </div>

              {creditError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {creditError}
                </div>
              )}

              {creditSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                  {creditSuccess}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isUpdatingCredits}
                  className="px-6 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 smooth-transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCredits || !newCredits}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl text-sm font-medium hover:from-purple-600 hover:to-blue-600 smooth-transition apple-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingCredits ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    'Apply Adjustment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}