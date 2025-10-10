'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usersAPI } from '@/lib/api';
import { UserRole } from '@/types';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import LayoutWrapper from '@/components/LayoutWrapper';

function NewUserContent() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    username: '',
    email: '',
    password: '',
    role: UserRole.USER,
    plant: '',
    line_process: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await usersAPI.createUser(formData);
      toast.success('User created successfully');
      router.push('/users');
    } catch (error: any) {
      console.error('Failed to create user:', error);
      toast.error(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-800">Only admins can create users.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      
      <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
            <p className="text-gray-600 mt-2">Add a new user to the system</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900">User ID *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                  placeholder="e.g., EMP001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Username *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="e.g., john_doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Email *</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g., john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Password *</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Role *</label>
                <select
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                >
                  <option value={UserRole.USER}>User (Inspector)</option>
                  <option value={UserRole.SUPERVISOR}>Supervisor</option>
                  <option value={UserRole.MANAGEMENT}>Management</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  User: Can create inspections | Supervisor: Can review inspections | Management: Can view analytics | Admin: Full access
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Plant</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.plant}
                  onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                  placeholder="e.g., Plant A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Line/Process</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.line_process}
                  onChange={(e) => setFormData({ ...formData, line_process: e.target.value })}
                  placeholder="e.g., Line 1"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/users')}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

export default function NewUserPage() {
  return (
    <LayoutWrapper>
      <NewUserContent />
    </LayoutWrapper>
  );
}
