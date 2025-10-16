'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usersAPI } from '@/lib/api';
import { User, UserRole } from '@/types';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import LayoutWrapper from '@/components/LayoutWrapper';

function EditUserContent() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const params = useParams();
  const router = useRouter();
  const userId = parseInt(params.id as string);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: UserRole.USER,
    plant: '',
    line_process: '',
    is_active: true,
  });

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      window.location.href = '/dashboard';
      return;
    }
    fetchUser();
  }, [userId, user]);

  const fetchUser = async () => {
    try {
      const data = await usersAPI.getUser(userId);
      setFormData({
        username: data.username,
        email: data.email,
        role: data.role,
        plant: data.plant || '',
        line_process: data.line_process || '',
        is_active: data.is_active,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      toast.error('Failed to fetch user');
      router.push('/users');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await usersAPI.updateUser(userId, formData);
      toast.success('User updated successfully');
      router.push('/users');
    } catch (error: any) {
      console.error('Failed to update user:', error);
      toast.error(error.response?.data?.detail || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <>
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      
      <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
            <p className="text-gray-600 mt-2">Update user information</p>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900">Username *</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Plant</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.plant}
                  onChange={(e) => setFormData({ ...formData, plant: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900">Line/Process</label>
                <input
                  type="text"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                  value={formData.line_process}
                  onChange={(e) => setFormData({ ...formData, line_process: e.target.value })}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label className="ml-2 block text-sm font-medium text-gray-900">
                  Active User
                </label>
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
                  {loading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

export default function EditUserPage() {
  return (
    <LayoutWrapper>
      <EditUserContent />
    </LayoutWrapper>
  );
}
