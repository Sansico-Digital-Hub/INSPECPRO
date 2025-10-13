'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { inspectionsAPI, formsAPI } from '@/lib/api';
import { Inspection, Form, InspectionStatus, UserRole, FieldType } from '@/types';
import { ArrowLeftIcon, CheckIcon, XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function InspectionDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const inspectionId = parseInt(params.id as string);
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInspectionDetails();
  }, [inspectionId]);

  const fetchInspectionDetails = async () => {
    try {
      const inspectionData = await inspectionsAPI.getInspection(inspectionId);
      setInspection(inspectionData);
      
      const formData = await formsAPI.getForm(inspectionData.form_id);
      setForm(formData);
    } catch (error) {
      console.error('Failed to fetch inspection:', error);
      toast.error('Failed to fetch inspection details');
      router.push('/inspections');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-export' });
      await inspectionsAPI.exportToPDF(inspectionId);
      toast.success('PDF exported successfully', { id: 'pdf-export' });
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF', { id: 'pdf-export' });
    }
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case InspectionStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case InspectionStatus.SUBMITTED:
        return 'bg-yellow-100 text-yellow-800';
      case InspectionStatus.ACCEPTED:
        return 'bg-green-100 text-green-800';
      case InspectionStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFieldResponse = (fieldId: number) => {
    return inspection?.responses.find(r => r.field_id === fieldId);
  };

  // Recursive function to render field with conditional logic
  const renderFieldWithConditional = (field: any, depth: number = 0): JSX.Element | null => {
    const response = getFieldResponse(field.id!);
    const fieldTypes = (field.field_types && field.field_types.length > 0) 
      ? field.field_types 
      : [field.field_type];
    
    // Dynamic colors based on depth
    const depthColors = [
      { border: 'border-blue-300', bg: 'bg-blue-50', text: 'text-blue-600' },
      { border: 'border-purple-300', bg: 'bg-purple-50', text: 'text-purple-600' },
      { border: 'border-indigo-300', bg: 'bg-indigo-50', text: 'text-indigo-600' },
      { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-600' },
      { border: 'border-teal-300', bg: 'bg-teal-50', text: 'text-teal-600' },
      { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-600' },
    ];
    
    const colorScheme = depthColors[depth % depthColors.length];
    
    // Find matching conditional rule based on response value
    const currentValue = response?.response_value || '';
    const matchingRule = field.has_conditional && field.conditional_rules
      ? field.conditional_rules.find((rule: any) => rule.condition_value === currentValue)
      : null;
    
    return (
      <React.Fragment key={field.id}>
        <div className={`${depth === 0 ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
          <dt className="text-sm font-medium text-gray-900">
            {field.field_name}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
            {depth > 0 && (
              <span className="ml-2 text-xs text-gray-500 italic">
                (Level {depth + 1} Nested)
              </span>
            )}
            <div className="text-xs text-gray-800 mt-1">
              {fieldTypes.length > 1 ? (
                <>Types: {fieldTypes.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' ')).join(', ')}</>
              ) : (
                <>Type: {field.field_type.charAt(0).toUpperCase() + field.field_type.slice(1).replace('_', ' ')}</>
              )}
            </div>
          </dt>
          <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            <div className="space-y-3">
              {fieldTypes.map((fieldType: string, typeIndex: number) => {
                if (fieldType === FieldType.MEASUREMENT) {
                  return (
                    <div key={typeIndex} className={`border-l-2 ${colorScheme.border} pl-3`}>
                      {fieldTypes.length > 1 && (
                        <div className="text-xs font-semibold text-gray-700 mb-1">
                          {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}:
                        </div>
                      )}
                      <div>Value: {response?.measurement_value ?? 'N/A'}</div>
                      <div>Status: {response?.pass_hold_status ?? 'N/A'}</div>
                    </div>
                  );
                } else if (fieldType === FieldType.PHOTO) {
                  return (
                    <div key={typeIndex} className={`border-l-2 ${colorScheme.border} pl-3`}>
                      {fieldTypes.length > 1 && (
                        <div className="text-xs font-semibold text-gray-700 mb-1">
                          {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}:
                        </div>
                      )}
                      {response?.response_value ? (
                        <div>
                          <img 
                            src={response.response_value} 
                            alt="Uploaded" 
                            className="max-w-xs rounded border border-gray-300 shadow-sm"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-500">No photo uploaded</div>
                      )}
                    </div>
                  );
                } else if (fieldType === FieldType.SIGNATURE) {
                  return (
                    <div key={typeIndex} className={`border-l-2 ${colorScheme.border} pl-3`}>
                      {fieldTypes.length > 1 && (
                        <div className="text-xs font-semibold text-gray-700 mb-1">
                          {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}:
                        </div>
                      )}
                      {response?.response_value ? (
                        <div>
                          <img 
                            src={response.response_value} 
                            alt="Signature" 
                            className="max-w-xs rounded border border-gray-300 shadow-sm bg-white"
                          />
                        </div>
                      ) : (
                        <div className="text-gray-500">No signature provided</div>
                      )}
                    </div>
                  );
                } else if (fieldType === FieldType.NOTES) {
                  return (
                    <div key={typeIndex} className={`border-l-2 ${colorScheme.border} pl-3`}>
                      {fieldTypes.length > 1 && (
                        <div className="text-xs font-semibold text-gray-700 mb-1">
                          {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}:
                        </div>
                      )}
                      <div className={`${colorScheme.bg} border ${colorScheme.border} rounded-md p-3`}>
                        <div className="flex items-start space-x-2">
                          <svg className={`h-5 w-5 ${colorScheme.text} mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <h4 className={`text-sm font-medium ${colorScheme.text} mb-1`}>Instructions:</h4>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {field.placeholder_text || field.field_options?.placeholder_text || 'No instructions provided'}
                            </p>
                          </div>
                        </div>
                      </div>
                      {field.field_options?.reference_photo && (
                        <div className="mt-2">
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Reference Photo:</h5>
                          <img 
                            src={field.field_options.reference_photo} 
                            alt="Reference" 
                            className="max-w-xs rounded border border-gray-300 shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  );
                } else if (fieldType === FieldType.BUTTON) {
                  return (
                    <div key={typeIndex} className={`border-l-2 ${colorScheme.border} pl-3`}>
                      {fieldTypes.length > 1 && (
                        <div className="text-xs font-semibold text-gray-700 mb-1">
                          {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}:
                        </div>
                      )}
                      <div>Status: {response?.pass_hold_status ?? 'No selection'}</div>
                    </div>
                  );
                } else {
                  return (
                    <div key={typeIndex} className={`border-l-2 ${colorScheme.border} pl-3`}>
                      {fieldTypes.length > 1 && (
                        <div className="text-xs font-semibold text-gray-700 mb-1">
                          {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}:
                        </div>
                      )}
                      <div>{response?.response_value || 'No response'}</div>
                    </div>
                  );
                }
              })}
            </div>
          </dd>
        </div>
        
        {/* Render conditional fields recursively - UNLIMITED DEPTH */}
        {matchingRule && matchingRule.next_fields && matchingRule.next_fields.length > 0 && (
          <div className={`${depth === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-3 sm:px-6`}>
            <div className={`ml-6 pl-4 border-l-2 ${colorScheme.border} space-y-2`}>
              <div className={`text-xs font-semibold ${colorScheme.text} mb-2 ${colorScheme.bg} px-2 py-1 rounded inline-block`}>
                ↳ Conditional Fields (when "{currentValue}") - Level {depth + 2}:
              </div>
              {matchingRule.next_fields.map((conditionalField: any) => renderFieldWithConditional(conditionalField, depth + 1))}
            </div>
          </div>
        )}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!inspection || !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Inspection not found</h1>
          <button
            onClick={() => router.push('/inspections')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Inspections
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">InsPecPro</h1>
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="/dashboard" className="text-gray-800 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </a>
                {user?.role === UserRole.ADMIN && (
                  <a href="/users" className="text-gray-800 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    Users
                  </a>
                )}
                <a href="/inspections" className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  Inspections
                </a>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-900">
                {user?.username} ({user?.role})
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => router.push('/inspections')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Inspections
            </button>
            
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Inspection #{inspection.id}
                </h2>
                <p className="text-gray-800 mt-1">Form: {form.form_name}</p>
                <p className="text-gray-800">Created: {new Date(inspection.created_at).toLocaleString()}</p>
                {inspection.reviewed_at && (
                  <p className="text-gray-800">Reviewed: {new Date(inspection.reviewed_at).toLocaleString()}</p>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleExportPDF}
                  className="inline-flex items-center px-4 py-2 border border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-600 bg-white hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                  Export PDF
                </button>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(inspection.status)}`}>
                  {inspection.status}
                </span>
              </div>
            </div>

            {inspection.rejection_reason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                <p className="text-sm text-red-700 mt-1">{inspection.rejection_reason}</p>
              </div>
            )}
          </div>

          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Inspection Responses
              </h3>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                {form.fields.map((field) => renderFieldWithConditional(field, 0))}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
