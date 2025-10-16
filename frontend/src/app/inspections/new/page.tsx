'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formsAPI, inspectionsAPI, docNumbersAPI } from '@/lib/api';
import { Form, FormField, FieldType, InspectionResponse, PassHoldStatus, UserRole, MeasurementType } from '@/types';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';

export default function NewInspectionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [forms, setForms] = useState<Form[]>([]);
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Record<string, InspectionResponse>>({});
  const [loading, setLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  // Recursive function to normalize field including nested conditional fields
  const normalizeField = (field: any): any => {
    const fieldTypes = field.field_types || field.field_options?.field_types || [];
    
    // Extract conditional logic from field_options if it exists there
    const hasConditional = field.has_conditional || field.field_options?.has_conditional || false;
    let conditionalRules = field.conditional_rules || field.field_options?.conditional_rules || [];
    
    // Recursively normalize nested fields in conditional rules
    if (conditionalRules && conditionalRules.length > 0) {
      conditionalRules = conditionalRules.map((rule: any) => ({
        ...rule,
        next_fields: (rule.next_fields || []).map((nestedField: any) => normalizeField(nestedField))
      }));
    }
    
    return {
      ...field,
      field_types: fieldTypes,
      has_conditional: hasConditional,
      conditional_rules: conditionalRules
    };
  };

  const fetchForms = async () => {
    try {
      const data = await formsAPI.getForms();
      
      // Normalize all forms and their fields
      const normalizedForms = data.map(form => ({
        ...form,
        fields: (form.fields || []).map(field => normalizeField(field))
      }));
      
      setForms(normalizedForms);
    } catch (error) {
      console.error('Failed to fetch forms:', error);
      toast.error('Failed to fetch forms');
    }
  };

  // Helper function to initialize responses for all fields including conditional ones
  const initializeFieldResponses = (
    field: FormField, 
    initialResponses: Record<string, InspectionResponse>,
    docNumber: string = '',
    parentPath: string = ''  // Track parent path for unique keys
  ) => {
    // Generate unique key for this field
    // For fields with ID: use ID
    // For conditional fields without ID: use parent path + field name
    const fieldKey = field.id 
      ? `${field.id}` 
      : `${parentPath}-${field.field_name.replace(/\s+/g, '_')}`;
    
    // Combine primary field_type with additional field_types
    const fieldTypes = field.field_types && field.field_types.length > 0
      ? [field.field_type, ...field.field_types.filter(t => t !== field.field_type)] // Avoid duplicates
      : [field.field_type];
    
    fieldTypes.forEach((fieldType) => {
      const responseKey = fieldTypes.length > 1 ? `${fieldKey}-${fieldType}` : fieldKey;
      
      // Auto-fill doc number if this is the No Doc field
      const isDocField = field.field_name.toLowerCase().includes('no doc') || 
                        field.field_name.toLowerCase().includes('no. doc');
      
      initialResponses[responseKey] = {
        field_id: field.id || null,  // Can be null for conditional fields
        response_value: isDocField && docNumber ? docNumber : '',
        measurement_value: undefined,
        pass_hold_status: undefined
      };
    });
    
    // Recursively initialize conditional fields
    if (field.has_conditional && field.conditional_rules) {
      field.conditional_rules.forEach((rule, ruleIndex) => {
        if (rule.next_fields && rule.next_fields.length > 0) {
          rule.next_fields.forEach((conditionalField, fieldIndex) => {
            // Create unique parent path for nested fields
            const newParentPath = `${fieldKey}-rule${ruleIndex}-field${fieldIndex}`;
            initializeFieldResponses(conditionalField, initialResponses, docNumber, newParentPath);
          });
        }
      });
    }
  };

  const handleFormSelect = async (form: Form) => {
    console.log('📋 Selected Form:', form);
    console.log('📋 Form Fields:', form.fields);
    form.fields.forEach((field, idx) => {
      console.log(`Field ${idx + 1}:`, {
        name: field.field_name,
        has_conditional: field.has_conditional,
        conditional_rules: field.conditional_rules
      });
    });
    
    setSelectedForm(form);
    const initialResponses: Record<string, InspectionResponse> = {};
    
    // Check if form has No Doc field and fetch next doc number
    let docNumber = '';
    const docField = form.fields.find(f => 
      f.field_name.toLowerCase().includes('no doc') || 
      f.field_name.toLowerCase().includes('no. doc')
    );
    
    if (docField) {
      try {
        const data = await docNumbersAPI.getNextDocNumber(form.id);
        docNumber = data.doc_number;
      } catch (error) {
        console.error('Failed to fetch doc number:', error);
      }
    }
    
    // Initialize responses for all fields including conditional ones
    form.fields.forEach(field => {
      initializeFieldResponses(field, initialResponses, docNumber);
    });
    
    setResponses(initialResponses);
  };

  const updateResponse = (fieldId: string, updates: Partial<InspectionResponse>) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: { ...prev[fieldId], ...updates }
    }));
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!selectedForm) {
      toast.error('Please select a form');
      return;
    }

    console.log('🔄 Inspection Submit Started');
    console.log('Form ID:', selectedForm.id);
    console.log('Total Responses:', Object.keys(responses).length);
    console.log('All Responses:', responses);

    setLoading(true);
    setIsDraft(asDraft);

    try {
      // Prepare responses: only include responses with field_id (skip conditional fields without ID)
      // Backend will need to handle conditional fields separately or we store them differently
      const validResponses = Object.entries(responses)
        .filter(([key, response]) => {
          // Include if has value and has field_id
          const hasValue = response.response_value || response.measurement_value !== undefined || response.pass_hold_status;
          const hasFieldId = response.field_id !== null;
          return hasValue && hasFieldId;
        })
        .map(([key, response]) => response);

      console.log('Valid Responses (with field_id):', validResponses);
      
      // For conditional fields without field_id, we'll store them as JSON in a special field
      // or handle them differently based on backend requirements
      const conditionalResponses = Object.entries(responses)
        .filter(([key, response]) => {
          const hasValue = response.response_value || response.measurement_value !== undefined || response.pass_hold_status;
          const noFieldId = response.field_id === null;
          return hasValue && noFieldId;
        })
        .map(([key, response]) => ({
          field_key: key,  // Store the unique key
          ...response
        }));

      console.log('Conditional Responses (without field_id):', conditionalResponses);

      const inspectionData = {
        form_id: selectedForm.id,
        responses: validResponses,
        // Store conditional responses as metadata if backend supports it
        // conditional_responses: conditionalResponses  // Uncomment if backend supports this
      };

      console.log('📤 Sending inspection data:', inspectionData);

      const inspection = await inspectionsAPI.createInspection(inspectionData);
      
      console.log('✅ Inspection created:', inspection);
      
      if (!asDraft) {
        await inspectionsAPI.submitInspection(inspection.id);
        toast.success('Inspection submitted successfully');
      } else {
        toast.success('Inspection saved as draft');
      }
      
      // TODO: If backend doesn't support conditional_responses yet,
      // we need to update backend to handle field_id: null
      if (conditionalResponses.length > 0) {
        console.warn('⚠️ Conditional responses not saved:', conditionalResponses.length, 'responses');
        console.warn('⚠️ Backend needs to support field_id: null or conditional_responses field');
      }
      
      router.push('/inspections');
    } catch (error: any) {
      console.error('❌ Failed to create inspection:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      toast.error(error.response?.data?.detail || 'Failed to create inspection');
    } finally {
      setLoading(false);
      setIsDraft(false);
    }
  };

  if (user?.role !== UserRole.USER && user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-800">You don't have permission to create inspections.</p>
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
                <a href="/inspections" className="text-gray-800 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                  Inspections
                </a>
                <span className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium">
                  New Inspection
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Inspection</h2>
            <p className="text-gray-800">Fill out the inspection form with accurate information</p>
          </div>

          {!selectedForm ? (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Form</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {forms.map((form) => (
                  <button
                    key={form.id}
                    onClick={() => handleFormSelect(form)}
                    className="text-left p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900">{form.form_name}</h4>
                    <p className="text-sm text-gray-900 mt-1">{form.description}</p>
                    <p className="text-xs text-gray-900 mt-2">{form.fields?.length || 0} fields</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{selectedForm.form_name}</h3>
                    <p className="text-gray-800">{selectedForm.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedForm(null)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Change Form
                  </button>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="space-y-6">
                  {selectedForm.fields
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
                  onClick={() => router.push('/inspections')}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-900 bg-yellow-100 hover:bg-yellow-200 rounded-md disabled:opacity-50"
                >
                  {loading && isDraft ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                >
                  {loading && !isDraft ? 'Submitting...' : 'Submit Inspection'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MultiTypeFieldRenderer({
  field,
  responses,
  updateResponse,
  parentPath = ''  // Track parent path for unique keys
}: {
  field: FormField;
  responses: Record<string, InspectionResponse>;
  updateResponse: (fieldId: string, updates: Partial<InspectionResponse>) => void;
  parentPath?: string;
}) {
  // Generate unique key for this field (same logic as initializeFieldResponses)
  const fieldKey = field.id 
    ? `${field.id}` 
    : `${parentPath}-${field.field_name.replace(/\s+/g, '_')}`;
  
  // Combine primary field_type with additional field_types
  const fieldTypes = field.field_types && field.field_types.length > 0
    ? [field.field_type, ...field.field_types.filter(t => t !== field.field_type)] // Avoid duplicates
    : [field.field_type];
  
  // Get the current response value to check conditional logic
  const mainResponseKey = fieldTypes.length > 1 ? `${fieldKey}-${fieldTypes[0]}` : fieldKey;
  const currentValue = responses[mainResponseKey]?.response_value || '';
  
  // Find matching conditional rule
  const matchingRule = field.has_conditional && field.conditional_rules
    ? field.conditional_rules.find(rule => rule.condition_value === currentValue)
    : null;
  
  // Debug log
  if (field.has_conditional) {
    console.log(`🔀 Field "${field.field_name}" (key: ${fieldKey}) has conditional logic:`, {
      has_conditional: field.has_conditional,
      conditional_rules: field.conditional_rules,
      currentValue: currentValue,
      matchingRule: matchingRule
    });
  }
  
  return (
    <div className="border-b border-gray-200 pb-6">
      <label className="block text-sm font-medium text-gray-900 mb-2">
        {field.field_name}
        {field.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-4">
        {fieldTypes.map((fieldType, index) => {
          const responseKey = fieldTypes.length > 1 ? `${fieldKey}-${fieldType}` : fieldKey;
          const response = responses[responseKey] || { 
            field_id: field.id || null, 
            response_value: '' 
          };
          
          const typeSpecificField: FormField = {
            ...field,
            field_type: fieldType
          };
          
          return (
            <div key={`${fieldKey}-${fieldType}-${index}`}>
              {fieldTypes.length > 1 && (
                <div className="text-xs font-semibold text-gray-800 mb-1 bg-blue-50 px-3 py-2 rounded border border-blue-200">
                  📝 {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}
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
      
      {/* Render conditional fields recursively */}
      {matchingRule && matchingRule.next_fields && matchingRule.next_fields.length > 0 && (
        <div className="ml-6 mt-4 pl-4 border-l-2 border-blue-300 space-y-4">
          <div className="text-xs font-semibold text-blue-600 mb-2">
            ↳ Conditional Fields (when "{currentValue}"):
          </div>
          {matchingRule.next_fields.map((conditionalField, idx) => {
            // Create unique parent path for nested fields
            const ruleIndex = field.conditional_rules?.findIndex(r => r === matchingRule) || 0;
            const newParentPath = `${fieldKey}-rule${ruleIndex}-field${idx}`;
            
            return (
              <MultiTypeFieldRenderer
                key={`conditional-${fieldKey}-${conditionalField.field_name}-${idx}`}
                field={conditionalField}
                responses={responses}
                updateResponse={updateResponse}
                parentPath={newParentPath}
              />
            );
          })}
        </div>
      )}
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

  // Check if field has multiple types
  const hasMultipleTypes = field.field_types && field.field_types.length > 1;
  const activeFieldType = hasMultipleTypes ? field.field_type : field.field_type;

  const renderSingleFieldType = (fieldType: FieldType) => {
    switch (fieldType) {
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

      case FieldType.SEARCH_DROPDOWN:
        return (
          <SearchableDropdown
            options={field.field_options?.options || []}
            value={response.response_value || ''}
            onChange={(value) => onUpdate({ response_value: value })}
            placeholder="Type to search..."
            required={field.is_required}
          />
        );

      case FieldType.BUTTON:
        return (
          <div className="flex space-x-2">
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
                required={field.is_required}
              />
            </div>
            {photoFile && (
              <div className="mt-2">
                <img
                  src={URL.createObjectURL(photoFile)}
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
                ref={(ref: SignatureCanvas | null) => setSignatureRef(ref)}
                canvasProps={{
                  width: 400,
                  height: 200,
                  className: 'signature-canvas w-full'
                }}
                onEnd={() => {
                  if (signatureRef) {
                    const dataURL = signatureRef.toDataURL();
                    onUpdate({ response_value: dataURL });
                  }
                }}
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => {
                  if (signatureRef) {
                    signatureRef.clear();
                    onUpdate({ response_value: '' });
                  }
                }}
                className="px-3 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Clear
              </button>
            </div>
          </div>
        );

      case FieldType.DATE:
        return (
          <input
            type="date"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={response.response_value || ''}
            onChange={(e) => onUpdate({ response_value: e.target.value })}
            required={field.is_required}
          />
        );

      case FieldType.DATETIME:
        const autoFillDateTime = field.field_options?.auto && !response.response_value;
        if (autoFillDateTime) {
          const now = new Date();
          const datetimeValue = now.toISOString().slice(0, 16);
          setTimeout(() => onUpdate({ response_value: datetimeValue }), 0);
        }
        return (
          <input
            type="datetime-local"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={response.response_value || ''}
            onChange={(e) => onUpdate({ response_value: e.target.value })}
            required={field.is_required}
            readOnly={field.field_options?.auto}
          />
        );

      case FieldType.TIME:
        return (
          <input
            type="time"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
            value={response.response_value || ''}
            onChange={(e) => onUpdate({ response_value: e.target.value })}
            required={field.is_required}
          />
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

  // If field has multiple types, render all of them
  if (hasMultipleTypes && field.field_types) {
    return (
      <div className="space-y-4">
        {field.field_types.map((fieldType, index) => (
          <div key={`${field.id}-${fieldType}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {fieldType.charAt(0).toUpperCase() + fieldType.slice(1).replace('_', ' ')}
              {field.is_required && <span className="text-red-600 ml-1">*</span>}
            </label>
            {renderSingleFieldType(fieldType)}
          </div>
        ))}
      </div>
    );
  }

  // Single field type
  return <div>{renderSingleFieldType(activeFieldType)}</div>;
}

// Searchable Dropdown Component
function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = 'Type to search...',
  required = false
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchTerm(option);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  useEffect(() => {
    if (value && !searchTerm) {
      setSearchTerm(value);
    }
  }, [value]);

  return (
    <div className="relative">
      <input
        type="text"
        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer text-gray-900"
              onClick={() => handleSelect(option)}
            >
              {option}
            </div>
          ))}
        </div>
      )}
      
      {isOpen && filteredOptions.length === 0 && searchTerm && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg px-3 py-2 text-gray-500">
          No options found
        </div>
      )}
    </div>
  );
}
