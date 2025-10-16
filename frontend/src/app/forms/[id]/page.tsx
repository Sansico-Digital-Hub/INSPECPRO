'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formsAPI } from '@/lib/api';
import { Form, UserRole } from '@/types';
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import LayoutWrapper from '@/components/LayoutWrapper';
import Link from 'next/link';

function FormDetailContent() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const params = useParams();
  const router = useRouter();
  const formId = parseInt(params.id as string);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      window.location.href = '/dashboard';
      return;
    }
    fetchForm();
  }, [formId, user]);

  const fetchForm = async () => {
    try {
      const data = await formsAPI.getForm(formId);
      setForm(data);
    } catch (error) {
      console.error('Failed to fetch form:', error);
      toast.error('Failed to fetch form');
      router.push('/forms');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (!form) {
    return (
      <>
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">Form not found</h3>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Sidebar />
      
      <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <button
              onClick={() => router.push('/forms')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Forms
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{form.form_name}</h2>
                <p className="text-gray-600 mt-2">{form.description}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Created: {new Date(form.created_at).toLocaleDateString()} | 
                  Updated: {new Date(form.updated_at).toLocaleDateString()}
                </p>
              </div>
              <Link
                href={`/forms/${formId}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit Form
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Form Fields ({form.fields.length})</h3>
            
            {form.fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No fields in this form
              </div>
            ) : (
              <div className="space-y-4">
                {form.fields
                  .sort((a, b) => a.field_order - b.field_order)
                  .map((field, index) => (
                    <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-500 mr-2">#{index + 1}</span>
                            <h4 className="text-base font-medium text-gray-900">{field.field_name}</h4>
                            {field.is_required && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Required</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Type: {field.field_type.charAt(0).toUpperCase() + field.field_type.slice(1).replace('_', ' ')}
                          </p>
                          
                          {field.field_options?.options && (
                            <p className="text-xs text-gray-500 mt-1">
                              Options: {field.field_options.options.join(', ')}
                            </p>
                          )}
                          
                          {field.measurement_type && (
                            <p className="text-xs text-gray-500 mt-1">
                              Measurement: {field.measurement_type} 
                              {field.measurement_min && ` (Min: ${field.measurement_min})`}
                              {field.measurement_max && ` (Max: ${field.measurement_max})`}
                            </p>
                          )}
                          
                          {field.placeholder_text && (
                            <p className="text-xs text-gray-500 mt-1 italic">
                              "{field.placeholder_text}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default function FormDetailPage() {
  return (
    <LayoutWrapper>
      <FormDetailContent />
    </LayoutWrapper>
  );
}
