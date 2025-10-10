'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { inspectionsAPI, formsAPI } from '@/lib/api';
import { Inspection, Form, FormField, FieldType, InspectionResponse, PassHoldStatus, UserRole, MeasurementType } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';

export default function EditInspectionPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const inspectionId = parseInt(params.id as string);
  
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Record<string, InspectionResponse>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInspectionDetails();
  }, [inspectionId]);

  const fetchInspectionDetails = async () => {
    try {
      const inspectionData = await inspectionsAPI.getInspection(inspectionId);
      setInspection(inspectionData);
      
      const formData = await formsAPI.getForm(inspectionData.form_id);
      setForm(formData);

      // Initialize responses from existing inspection data
      const initialResponses: Record<string, InspectionResponse> = {};
      formData.fields.forEach(field => {
        if (field.id) {
          const fieldTypes = (field.field_types && field.field_types.length > 0) 
            ? field.field_types 
            : [field.field_type];
          
          fieldTypes.forEach((fieldType) => {
            const responseKey = fieldTypes.length > 1 ? `${field.id}-${fieldType}` : `${field.id}`;
            const existingResponse = inspectionData.responses.find(r => r.field_id === field.id);
            
            initialResponses[responseKey] = existingResponse || {
              field_id: field.id!,
              response_value: '',
              measurement_value: undefined,
              pass_hold_status: undefined
            };
          });
        }
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error('Failed to fetch inspection:', error);
      toast.error('Failed to fetch inspection details');
      router.push('/inspections');
    } finally {
      setLoading(false);
    }
  };

  const updateResponse = (fieldId: string, updates: Partial<InspectionResponse>) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], ...updates }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inspection || !form) {
      toast.error('Inspection data not loaded');
      return;
    }

    setSaving(true);

    try {
      const inspectionData = {
        responses: Object.values(responses).filter(response => 
          response.response_value || response.measurement_value !== undefined
        )
      };

      await inspectionsAPI.updateInspection(inspectionId, inspectionData);
      toast.success('Inspection updated successfully');
      router.push('/inspections');
    } catch (error: any) {
      console.error('Failed to update inspection:', error);
      toast.error(error.response?.data?.detail || 'Failed to update inspection');
    } finally {
      setSaving(false);
    }
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

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <button
              onClick={() => router.push('/inspections')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back to Inspections
            </button>
            
            <h2 className="text-2xl font-bold text-gray-900">
              Edit Inspection #{inspection.id}
            </h2>
            <p className="text-gray-800 mt-1">Form: {form.form_name}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-6">
                {form.fields
                  .sort((a, b) => a.field_order - b.field_order)
                  .map((field) => (
                    <MultiTypeFieldRenderer
                      key={field.id}
                      field={field}
                      responses={responses}
                      updateResponse={updateResponse}
                    />
                  ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/inspections')}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

function MultiTypeFieldRenderer({
  field,
  responses,
  updateResponse
}: {
  field: FormField;
  responses: Record<string, InspectionResponse>;
  updateResponse: (fieldId: string, updates: Partial<InspectionResponse>) => void;
}) {
  const fieldTypes = (field.field_types && field.field_types.length > 0) 
    ? field.field_types 
    : [field.field_type];
  
  return (
    <div className="border-b border-gray-200 pb-6">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {field.field_name}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-4">
        {fieldTypes.map((fieldType, index) => {
          const responseKey = fieldTypes.length > 1 ? `${field.id}-${fieldType}` : `${field.id}`;
          const response = responses[responseKey] || { 
            field_id: field.id!, 
            response_value: '' 
          };
          
          const typeSpecificField: FormField = {
            ...field,
            field_type: fieldType
          };
          
          return (
            <div key={`${field.id}-${fieldType}-${index}`}>
              {fieldTypes.length > 1 && (
                <div className="text-xs font-medium text-gray-600 mb-1 bg-blue-50 px-2 py-1 rounded">
                  📝 {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}:
                </div>
              )}
              <FieldRenderer
                field={typeSpecificField}
                response={response}
                onUpdate={(updates) => updateResponse(responseKey, updates)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  response,
  onUpdate
}: {
  field: FormField;
  response: InspectionResponse;
  onUpdate: (updates: Partial<InspectionResponse>) => void;
}) {
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const renderField = () => {
    switch (field.field_type) {
      case FieldType.TEXT:
        return (
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={response.response_value || ''}
            onChange={(e) => onUpdate({ response_value: e.target.value })}
            placeholder={`Enter ${field.field_name}`}
            required={field.is_required}
          />
        );

      case FieldType.NOTES:
        return (
          <div className="mt-1">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-start space-x-2">
                <svg className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Instructions from Admin:</h4>
                  <p className="text-sm text-blue-800 whitespace-pre-wrap">
                    {field.placeholder_text || field.field_options?.placeholder_text || 'No instructions provided'}
                  </p>
                </div>
              </div>
            </div>
            {field.field_options?.reference_photo && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Reference Photo:</h4>
                <img 
                  src={field.field_options.reference_photo} 
                  alt="Reference" 
                  className="max-w-md rounded border border-gray-300 shadow-sm"
                />
              </div>
            )}
          </div>
        );

      case FieldType.DROPDOWN:
      case FieldType.SEARCH_DROPDOWN:
        return (
          <select
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={response.response_value || ''}
            onChange={(e) => onUpdate({ response_value: e.target.value })}
            required={field.is_required}
          >
            <option value="">Select an option</option>
            {field.field_options?.options?.map((option: string, index: number) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case FieldType.BUTTON:
        return (
          <div className="flex space-x-2">
            {(field.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]).map((btn: any, index: number) => (
              <button
                key={index}
                type="button"
                onClick={() => onUpdate({ pass_hold_status: btn.label.toLowerCase() as PassHoldStatus })}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  response.pass_hold_status === btn.label.toLowerCase()
                    ? `bg-${btn.color}-600 text-white`
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        );

      case FieldType.MEASUREMENT:
        const handleMeasurementChange = (value: number | undefined) => {
          if (value === undefined) {
            onUpdate({ measurement_value: undefined, pass_hold_status: undefined });
            return;
          }

          let autoStatus: PassHoldStatus | undefined = undefined;

          if (field.measurement_type === MeasurementType.BETWEEN) {
            if (field.measurement_min !== undefined && field.measurement_max !== undefined) {
              autoStatus = (value >= field.measurement_min && value <= field.measurement_max)
                ? PassHoldStatus.PASS
                : PassHoldStatus.HOLD;
            }
          } else if (field.measurement_type === MeasurementType.HIGHER) {
            if (field.measurement_min !== undefined) {
              autoStatus = value >= field.measurement_min
                ? PassHoldStatus.PASS
                : PassHoldStatus.HOLD;
            }
          } else if (field.measurement_type === MeasurementType.LOWER) {
            if (field.measurement_max !== undefined) {
              autoStatus = value <= field.measurement_max
                ? PassHoldStatus.PASS
                : PassHoldStatus.HOLD;
            }
          }

          onUpdate({ measurement_value: value, pass_hold_status: autoStatus });
        };

        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900">Measurement Value</label>
              <input
                type="number"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                value={response.measurement_value || ''}
                onChange={(e) => handleMeasurementChange(parseFloat(e.target.value) || undefined)}
                placeholder="Enter measurement"
                required={field.is_required}
              />
              {field.measurement_type === MeasurementType.BETWEEN && field.measurement_min !== undefined && field.measurement_max !== undefined && (
                <p className="text-sm text-gray-600 mt-1">
                  Must be between {field.measurement_min} and {field.measurement_max}
                </p>
              )}
              {field.measurement_type === MeasurementType.HIGHER && field.measurement_min !== undefined && (
                <p className="text-sm text-gray-600 mt-1">
                  Must be higher than or equal to {field.measurement_min}
                </p>
              )}
              {field.measurement_type === MeasurementType.LOWER && field.measurement_max !== undefined && (
                <p className="text-sm text-gray-600 mt-1">
                  Must be lower than or equal to {field.measurement_max}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900">Result (Auto-calculated)</label>
              <div className="flex space-x-2 mt-1">
                <button
                  type="button"
                  onClick={() => onUpdate({ pass_hold_status: PassHoldStatus.PASS })}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    response.pass_hold_status === PassHoldStatus.PASS
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Pass
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ pass_hold_status: PassHoldStatus.HOLD })}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    response.pass_hold_status === PassHoldStatus.HOLD
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                  }`}
                >
                  Hold
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Status is automatically set based on measurement value. You can override if needed.</p>
            </div>
          </div>
        );

      case FieldType.PHOTO:
        return (
          <div className="space-y-4">
            <div>
              <input
                type="file"
                accept="image/*"
                className="mt-1 block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFile(file);
                    onUpdate({ response_value: file.name });
                  }
                }}
                required={field.is_required && !response.response_value}
              />
            </div>
            {(photoFile || response.response_value) && (
              <div className="mt-2">
                <img
                  src={photoFile ? URL.createObjectURL(photoFile) : response.response_value}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
        );

      case FieldType.SIGNATURE:
        return (
          <div className="space-y-4">
            <div className="border border-gray-300 rounded-md">
              <SignatureCanvas
                ref={(ref) => setSignatureRef(ref)}
                canvasProps={{
                  className: 'w-full h-40 cursor-crosshair',
                }}
                onEnd={() => {
                  if (signatureRef && !signatureRef.isEmpty()) {
                    onUpdate({ response_value: signatureRef.toDataURL() });
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (signatureRef) {
                  signatureRef.clear();
                  onUpdate({ response_value: '' });
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Signature
            </button>
            {response.response_value && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Current signature:</p>
                <img
                  src={response.response_value}
                  alt="Current Signature"
                  className="border border-gray-300 rounded bg-white"
                />
              </div>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={response.response_value || ''}
            onChange={(e) => onUpdate({ response_value: e.target.value })}
            placeholder={`Enter ${field.field_name}`}
            required={field.is_required}
          />
        );
    }
  };

  return <div>{renderField()}</div>;
}
