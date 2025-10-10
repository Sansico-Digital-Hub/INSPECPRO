'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { dashboardAPI } from '@/lib/api';
import { DashboardStats, UserRole } from '@/types';
import { 
  ClipboardDocumentListIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import Link from 'next/link';

function DashboardContent() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await dashboardAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Inspections',
      value: stats?.total_inspections || 0,
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Submitted',
      value: stats?.submitted_inspections || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
    },
    {
      name: 'Accepted',
      value: stats?.accepted_inspections || 0,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Rejected',
      value: stats?.rejected_inspections || 0,
      icon: XCircleIcon,
      color: 'bg-red-500',
    },
    {
      name: 'Draft',
      value: stats?.draft_inspections || 0,
      icon: DocumentTextIcon,
      color: 'bg-gray-500',
    },
  ];

  const quickActions = [];
  
  if (user?.role === UserRole.ADMIN) {
    quickActions.push(
      { name: 'Create Form', href: '/forms/new', icon: DocumentTextIcon, color: 'bg-blue-600' },
      { name: 'Add User', href: '/users/new', icon: UsersIcon, color: 'bg-green-600' }
    );
  }
  
  if (user?.role === UserRole.USER || user?.role === UserRole.ADMIN) {
    quickActions.push(
      { name: 'New Inspection', href: '/inspections/new', icon: ClipboardDocumentListIcon, color: 'bg-purple-600' }
    );
  }

  return (
    <>
      <Sidebar />
      
      <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.username}!
            </h1>
            <p className="text-gray-600 mt-2">
              Role: <span className="font-semibold">{user?.role}</span>
              {user?.plant && ` | Plant: ${user.plant}`}
              {user?.line_process && ` | Line: ${user.line_process}`}
            </p>
          </div>

          {/* Stats Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
                {statCards.map((stat) => (
                  <div
                    key={stat.name}
                    className="relative bg-white pt-5 px-4 pb-12 sm:pt-6 sm:px-6 shadow rounded-lg overflow-hidden"
                  >
                    <dt>
                      <div className={`absolute ${stat.color} rounded-md p-3`}>
                        <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      <p className="ml-16 text-sm font-medium text-gray-500 truncate">{stat.name}</p>
                    </dt>
                    <dd className="ml-16 pb-6 flex items-baseline sm:pb-7">
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    </dd>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              {quickActions.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action) => (
                      <Link
                        key={action.name}
                        href={action.href}
                        className={`${action.color} text-white rounded-lg p-4 hover:opacity-90 transition-opacity flex items-center space-x-3`}
                      >
                        <action.icon className="h-6 w-6" />
                        <span className="font-medium">{action.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <LayoutWrapper>
      <DashboardContent />
    </LayoutWrapper>
  );
}
