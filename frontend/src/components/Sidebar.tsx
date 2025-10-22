'use client';

import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/contexts/SidebarContext';
import { UserRole } from '@/types';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UsersIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isCollapsed, toggleSidebar } = useSidebar();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: [UserRole.ADMIN, UserRole.USER, UserRole.SUPERVISOR, UserRole.MANAGEMENT] },
    { name: 'Forms', href: '/forms', icon: DocumentTextIcon, roles: [UserRole.ADMIN] },
    { name: 'Users', href: '/users', icon: UsersIcon, roles: [UserRole.ADMIN] },
    { name: 'Inspections', href: '/inspections', icon: ClipboardDocumentListIcon, roles: [UserRole.ADMIN, UserRole.USER, UserRole.SUPERVISOR, UserRole.MANAGEMENT] },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: [UserRole.MANAGEMENT, UserRole.ADMIN] },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className={`fixed inset-y-0 left-0 z-50 bg-gray-900 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex h-full flex-col">
        {/* Logo & Toggle */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white">Sanalyze</h1>
          )}
          <button
            onClick={toggleSidebar}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            {isCollapsed ? (
              <Bars3Icon className="h-6 w-6" />
            ) : (
              <XMarkIcon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <item.icon className="mr-3 h-6 w-6 flex-shrink-0" />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-800 p-4">
          {!isCollapsed && user && (
            <div className="mb-3">
              <p className="text-sm font-medium text-white">{user.username}</p>
              <p className="text-xs text-gray-400">{user.role}</p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            {isCollapsed ? 'Out' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
}
