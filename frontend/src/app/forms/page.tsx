'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { formsAPI } from '@/lib/api';
import { Form, UserRole } from '@/types';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import Link from 'next/link';

function FormsContent() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      window.location.href = '/dashboard';
      return;
    }
    fetchForms();
  }, [user]);

  const fetchForms = async () => {
    try {
      const data = await formsAPI.getForms();
      setForms(data);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      toast.error('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this form?')) {
      try {
        await formsAPI.deleteForm(id);
        toast.success('Form deleted successfully');
        fetchForms();
      } catch (error) {
        console.error('Failed to delete form:', error);
        toast.error('Failed to delete form');
      }
    }
  };

  return (
    <>
      <Sidebar />
      
      <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Forms Management</h2>
            <Link
              href="/forms/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Form
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {forms.map((form) => (
                  <li key={form.id}>
                    <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{form.form_name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{form.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {form.fields?.length || 0} fields | Created: {new Date(form.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/forms/${form.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                        <Link
                          href={`/forms/${form.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(form.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {forms.length === 0 && !loading && (
            <div className="text-center py-12">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No forms</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new form.</p>
              <div className="mt-6">
                <Link
                  href="/forms/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Form
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function FormsPage() {
  return (
    <LayoutWrapper>
      <FormsContent />
    </LayoutWrapper>
  );
}
