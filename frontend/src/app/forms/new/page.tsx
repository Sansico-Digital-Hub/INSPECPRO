'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { formsAPI } from '@/lib/api';
import { FormField, FieldType, MeasurementType, UserRole } from '@/types';
import { PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import LayoutWrapper from '@/components/LayoutWrapper';

function NewFormContent() {
  const { user } = useAuth();
  const { isCollapsed } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formName, setFormName] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const addField = () => {
    const newField: FormField = {
      field_name: '',
      field_type: FieldType.TEXT,
      field_types: [],
      field_options: {},
      is_required: false,
      field_order: fields.length,
    };
    setFields([...fields, newField]);
  };

  const addFieldAt = (position: number) => {
    const newField: FormField = {
      field_name: '',
      field_type: FieldType.TEXT,
      field_types: [],
      field_options: {},
      is_required: false,
      field_order: position,
    };
    const newFields = [
      ...fields.slice(0, position),
      newField,
      ...fields.slice(position)
    ];
    // Update field_order for all fields
    newFields.forEach((field, i) => {
      field.field_order = i;
    });
    setFields(newFields);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    newFields.forEach((field, i) => {
      field.field_order = i;
    });
    setFields(newFields);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    newFields.forEach((field, i) => {
      field.field_order = i;
    });
    setFields(newFields);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fields.length === 0) {
      toast.error('Please add at least one field');
      return;
    }

    setLoading(true);

    try {
      await formsAPI.createForm({
        form_name: formName,
        description,
        fields,
      });
      toast.success('Form created successfully');
      router.push('/forms');
    } catch (error: any) {
      console.error('Failed to create form:', error);
      toast.error(error.response?.data?.detail || 'Failed to create form');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="text-gray-800">Only admins can create forms.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar />
      
      <main className={`flex-1 transition-all duration-300 p-6 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Form</h2>
            <p className="text-gray-600 mt-2">Build an inspection form with custom fields</p>
          </div>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const target = e.target as HTMLElement;
                const tag = target.tagName.toLowerCase();
                if (tag !== 'textarea') {
                  e.preventDefault();
                }
              }
            }}
            className="space-y-6"
          >
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Form Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900">Form Name *</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full border border-gray-900 rounded-md px-3 py-2 text-gray-900"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Daily Equipment Inspection"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900">Description</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-gray-900"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this form..."
                  />
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Form Fields</h3>
                <button
                  type="button"
                  onClick={addField}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Field
                </button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No fields added yet. Click "Add Field" to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <React.Fragment key={index}>
                      {/* Add Field Button Above */}
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => addFieldAt(index)}
                          className="text-xs px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200 border-dashed"
                        >
                          + Add Field Here
                        </button>
                      </div>
                      
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Field #{index + 1}</h4>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => moveField(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowUpIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveField(index, 'down')}
                            disabled={index === fields.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            <ArrowDownIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeField(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {!collapsed[index] && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-900">Field Name *</label>
                          <input
                            type="text"
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                            value={field.field_name}
                            onChange={(e) => updateField(index, { field_name: e.target.value })}
                            placeholder="e.g., Temperature Reading"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-900">Field Type *</label>
                          <select
                            required
                            className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                            value={field.field_type}
                            onChange={(e) => updateField(index, { field_type: e.target.value as FieldType })}
                          >
                            <option value={FieldType.TEXT}>Text</option>
                            <option value={FieldType.DROPDOWN}>Dropdown</option>
                            <option value={FieldType.SEARCH_DROPDOWN}>Search Dropdown</option>
                            <option value={FieldType.BUTTON}>Button (Pass/Hold)</option>
                            <option value={FieldType.PHOTO}>Photo</option>
                            <option value={FieldType.SIGNATURE}>Signature</option>
                            <option value={FieldType.MEASUREMENT}>Measurement</option>
                            <option value={FieldType.NOTES}>Notes (Instructions)</option>
                            <option value={FieldType.DATE}>Date</option>
                            <option value={FieldType.DATETIME}>Date & Time</option>
                            <option value={FieldType.TIME}>Time</option>
                            <option value={FieldType.SUBFORM}>Subform (Repeatable)</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-900 mb-2">Additional Field Types (optional)</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-3 border border-gray-300 rounded-md bg-gray-50">
                            {[
                              { value: FieldType.TEXT, label: 'Text' },
                              { value: FieldType.DROPDOWN, label: 'Dropdown' },
                              { value: FieldType.SEARCH_DROPDOWN, label: 'Search Dropdown' },
                              { value: FieldType.BUTTON, label: 'Button (Pass/Hold)' },
                              { value: FieldType.PHOTO, label: 'Photo' },
                              { value: FieldType.SIGNATURE, label: 'Signature' },
                              { value: FieldType.MEASUREMENT, label: 'Measurement' },
                              { value: FieldType.NOTES, label: 'Notes' },
                              { value: FieldType.DATE, label: 'Date' },
                              { value: FieldType.DATETIME, label: 'Date & Time' },
                              { value: FieldType.TIME, label: 'Time' },
                              { value: FieldType.SUBFORM, label: 'Subform (Repeatable)' },
                            ].map((type) => (
                              <label key={type.value} className="flex items-center space-x-2 text-xs text-gray-900 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  checked={(field.field_types || []).includes(type.value)}
                                  onChange={(e) => {
                                    const currentTypes = field.field_types || [];
                                    const newTypes = e.target.checked
                                      ? [...currentTypes, type.value]
                                      : currentTypes.filter(t => t !== type.value);
                                    updateField(index, { field_types: newTypes });
                                  }}
                                />
                                <span>{type.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={field.is_required}
                            onChange={(e) => updateField(index, { is_required: e.target.checked })}
                          />
                          <label className="ml-2 block text-xs font-medium text-gray-900">
                            Required Field
                          </label>
                        </div>

                        {(field.field_type === FieldType.DROPDOWN || field.field_type === FieldType.SEARCH_DROPDOWN || field.field_types?.includes(FieldType.DROPDOWN) || field.field_types?.includes(FieldType.SEARCH_DROPDOWN)) && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-900">Options (comma-separated)</label>
                            <input
                              type="text"
                              className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                              placeholder="e.g., Option 1, Option 2, Option 3"
                              onChange={(e) => {
                                const options = e.target.value.split(',').map(o => o.trim()).filter(o => o);
                                updateField(index, { 
                                  field_options: { ...field.field_options, options } 
                                });
                              }}
                            />
                          </div>
                        )}

                        {(field.field_type === FieldType.MEASUREMENT || field.field_types?.includes(FieldType.MEASUREMENT)) && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-900">Measurement Type</label>
                              <select
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                                value={field.measurement_type || MeasurementType.BETWEEN}
                                onChange={(e) => updateField(index, { measurement_type: e.target.value as MeasurementType })}
                              >
                                <option value={MeasurementType.BETWEEN}>Between (Min-Max)</option>
                                <option value={MeasurementType.HIGHER}>Higher Than (Min only)</option>
                                <option value={MeasurementType.LOWER}>Lower Than (Max only)</option>
                              </select>
                            </div>

                            {/* Show Min Value for BETWEEN and HIGHER */}
                            {(field.measurement_type === MeasurementType.BETWEEN || field.measurement_type === MeasurementType.HIGHER || !field.measurement_type) && (
                              <div>
                                <label className="block text-xs font-medium text-gray-900">
                                  Min Value {field.measurement_type === MeasurementType.HIGHER && '*'}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                                  value={field.measurement_min || ''}
                                  onChange={(e) => updateField(index, { measurement_min: parseFloat(e.target.value) })}
                                  placeholder={field.measurement_type === MeasurementType.HIGHER ? 'Required' : 'Optional'}
                                />
                              </div>
                            )}

                            {/* Show Max Value for BETWEEN and LOWER */}
                            {(field.measurement_type === MeasurementType.BETWEEN || field.measurement_type === MeasurementType.LOWER || !field.measurement_type) && (
                              <div>
                                <label className="block text-xs font-medium text-gray-900">
                                  Max Value {field.measurement_type === MeasurementType.LOWER && '*'}
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                                  value={field.measurement_max || ''}
                                  onChange={(e) => updateField(index, { measurement_max: parseFloat(e.target.value) })}
                                  placeholder={field.measurement_type === MeasurementType.LOWER ? 'Required' : 'Optional'}
                                />
                              </div>
                            )}
                          </>
                        )}

                        {(field.field_type === FieldType.NOTES || field.field_types?.includes(FieldType.NOTES)) && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-900">Instructions/Notes</label>
                            <textarea
                              className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                              rows={3}
                              value={field.placeholder_text || field.field_options?.placeholder_text || ''}
                              onChange={(e) => updateField(index, { 
                                placeholder_text: e.target.value,
                                field_options: { ...field.field_options, placeholder_text: e.target.value }
                              })}
                              placeholder="Instructions for the inspector..."
                            />
                          </div>
                        )}

                        {/* Photo Field Settings */}
                        {(field.field_type === FieldType.PHOTO || field.field_types?.includes(FieldType.PHOTO)) && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-900">Max File Size (MB)</label>
                              <input
                                type="number"
                                min="1"
                                max="50"
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                                value={field.field_options?.max_size_mb || 5}
                                onChange={(e) => updateField(index, { 
                                  field_options: { ...field.field_options, max_size_mb: parseInt(e.target.value) } 
                                })}
                                placeholder="5"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-900">Image Quality</label>
                              <select
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                                value={field.field_options?.quality || 'medium'}
                                onChange={(e) => updateField(index, { 
                                  field_options: { ...field.field_options, quality: e.target.value } 
                                })}
                              >
                                <option value="low">Low (50% - Smaller file)</option>
                                <option value="medium">Medium (70%)</option>
                                <option value="high">High (90%)</option>
                                <option value="original">Original (No compression)</option>
                              </select>
                            </div>
                          </>
                        )}

                        {/* Button Field Settings */}
                        {(field.field_type === FieldType.BUTTON || field.field_types?.includes(FieldType.BUTTON)) && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-900 mb-2">Button Options</label>
                            <div className="space-y-2">
                              {(field.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]).map((btn: any, btnIndex: number) => (
                                <div key={btnIndex} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                                  <input
                                    type="text"
                                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                    placeholder="Button Label"
                                    value={btn.label}
                                    onChange={(e) => {
                                      const options = [...(field.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}])];
                                      options[btnIndex] = { ...options[btnIndex], label: e.target.value };
                                      updateField(index, { field_options: { ...field.field_options, button_options: options } });
                                    }}
                                  />
                                  <select
                                    className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                    value={btn.color}
                                    onChange={(e) => {
                                      const options = [...(field.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}])];
                                      options[btnIndex] = { ...options[btnIndex], color: e.target.value };
                                      updateField(index, { field_options: { ...field.field_options, button_options: options } });
                                    }}
                                  >
                                    <option value="green">Green</option>
                                    <option value="yellow">Yellow</option>
                                    <option value="red">Red</option>
                                    <option value="blue">Blue</option>
                                    <option value="gray">Gray</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const options = (field.field_options?.button_options || []).filter((_: any, i: number) => i !== btnIndex);
                                      updateField(index, { field_options: { ...field.field_options, button_options: options } });
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  const options = [...(field.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]), {label: '', color: 'gray'}];
                                  updateField(index, { field_options: { ...field.field_options, button_options: options } });
                                }}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                + Add Button Option
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Signature Field Settings */}
                        {(field.field_type === FieldType.SIGNATURE || field.field_types?.includes(FieldType.SIGNATURE)) && (
                          <>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                checked={field.field_options?.require_name || false}
                                onChange={(e) => updateField(index, { 
                                  field_options: { ...field.field_options, require_name: e.target.checked } 
                                })}
                              />
                              <label className="ml-2 block text-xs font-medium text-gray-900">
                                Require Name Input
                              </label>
                            </div>
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                checked={field.field_options?.require_date || false}
                                onChange={(e) => updateField(index, { 
                                  field_options: { ...field.field_options, require_date: e.target.checked } 
                                })}
                              />
                              <label className="ml-2 block text-xs font-medium text-gray-900">
                                Auto-add Date/Time
                              </label>
                            </div>
                          </>
                        )}

                        {/* Date/DateTime/Time Field Settings */}
                        {((field.field_type === FieldType.DATE || field.field_type === FieldType.DATETIME || field.field_type === FieldType.TIME) || (field.field_types?.includes(FieldType.DATE) || field.field_types?.includes(FieldType.DATETIME) || field.field_types?.includes(FieldType.TIME))) && (
                          <>
                            <div>
                              <label className="block text-xs font-medium text-gray-900">Default Value</label>
                              <select
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                                value={field.field_options?.default_value || 'none'}
                                onChange={(e) => updateField(index, { 
                                  field_options: { ...field.field_options, default_value: e.target.value } 
                                })}
                              >
                                <option value="none">None</option>
                                <option value="today">Today/Now</option>
                                <option value="custom">Custom</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-900">Min Date (Optional)</label>
                              <input
                                type="date"
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                                value={field.field_options?.min_date || ''}
                                onChange={(e) => updateField(index, { 
                                  field_options: { ...field.field_options, min_date: e.target.value } 
                                })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-900">Max Date (Optional)</label>
                              <input
                                type="date"
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900"
                                value={field.field_options?.max_date || ''}
                                onChange={(e) => updateField(index, { 
                                  field_options: { ...field.field_options, max_date: e.target.value } 
                                })}
                              />
                            </div>
                          </>
                        )}

                        {/* Subform Field Settings */}
                        {(field.field_type === FieldType.SUBFORM || field.field_types?.includes(FieldType.SUBFORM)) && (
                          <div className="md:col-span-2">
                            <label className="block text-xs font-medium text-gray-900 mb-2">Subform Template Fields</label>
                            <p className="text-xs text-gray-600 mb-3">
                              Define the fields that will appear in each subform instance. Inspectors can add multiple instances of this subform.
                            </p>

                            {/* Min/Max Instances */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-900 mb-1">Minimum Instances</label>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                  value={field.field_options?.min_instances || 0}
                                  onChange={(e) => updateField(index, {
                                    field_options: { ...field.field_options, min_instances: parseInt(e.target.value) || 0 }
                                  })}
                                  placeholder="0"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-900 mb-1">Maximum Instances (0 = unlimited)</label>
                                <input
                                  type="number"
                                  min="0"
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                  value={field.field_options?.max_instances || 0}
                                  onChange={(e) => updateField(index, {
                                    field_options: { ...field.field_options, max_instances: parseInt(e.target.value) || 0 }
                                  })}
                                  placeholder="0 (unlimited)"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
                              {(field.field_options?.subform_fields || []).map((subField: any, subIndex: number) => (
                                <div key={subIndex} className="space-y-3 bg-white p-3 rounded border">
                                  {/* Row: Field Name + Field Type + Delete */}
                                  <div className="flex items-center space-x-2">
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        placeholder="Field Name"
                                        value={subField.field_name || ''}
                                        onChange={(e) => {
                                          const subFields = [...(field.field_options?.subform_fields || [])];
                                          subFields[subIndex] = { ...subFields[subIndex], field_name: e.target.value };
                                          updateField(index, { 
                                            field_options: { ...field.field_options, subform_fields: subFields } 
                                          });
                                        }}
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <div className="grid grid-cols-2 gap-2 p-2 border border-gray-300 rounded bg-gray-50">
                                        {[
                                          { value: FieldType.TEXT, label: 'Text' },
                                          { value: FieldType.DROPDOWN, label: 'Dropdown' },
                                          { value: FieldType.SEARCH_DROPDOWN, label: 'Search Dropdown' },
                                          { value: FieldType.BUTTON, label: 'Button (Pass/Hold)' },
                                          { value: FieldType.PHOTO, label: 'Photo' },
                                          { value: FieldType.SIGNATURE, label: 'Signature' },
                                          { value: FieldType.MEASUREMENT, label: 'Measurement' },
                                          { value: FieldType.NOTES, label: 'Notes' },
                                          { value: FieldType.DATE, label: 'Date' },
                                          { value: FieldType.DATETIME, label: 'Date & Time' },
                                          { value: FieldType.TIME, label: 'Time' },
                                        ].map((type) => (
                                          <label key={type.value} className="flex items-center space-x-2 text-xs text-gray-900">
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                              checked={(subField.field_types || []).includes(type.value) || subField.field_type === type.value}
                                              onChange={(e) => {
                                                const subFields = [...(field.field_options?.subform_fields || [])];
                                                const current = subField.field_types || (subField.field_type ? [subField.field_type] : []);
                                                const next = e.target.checked
                                                  ? Array.from(new Set([...current, type.value]))
                                                  : current.filter((t: any) => t !== type.value);
                                                subFields[subIndex] = { ...subFields[subIndex], field_types: next };
                                                updateField(index, { 
                                                  field_options: { ...field.field_options, subform_fields: subFields } 
                                                });
                                              }}
                                            />
                                            <span>{type.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const subFields = (field.field_options?.subform_fields || []).filter((_: any, i: number) => i !== subIndex);
                                        updateField(index, { 
                                          field_options: { ...field.field_options, subform_fields: subFields } 
                                        });
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </button>
                                  </div>

                                  {/* Per-type adjustments for Subform fields */}
                                  {/* Dropdown / Search Dropdown */}
                                  {(subField.field_type === FieldType.DROPDOWN || subField.field_type === FieldType.SEARCH_DROPDOWN || subField.field_types?.includes(FieldType.DROPDOWN) || subField.field_types?.includes(FieldType.SEARCH_DROPDOWN)) && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900">Options (comma-separated)</label>
                                      <input
                                        type="text"
                                        className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        value={(subField.field_options?.options || []).join(', ')}
                                        onChange={(e) => {
                                          const subFields = [...(field.field_options?.subform_fields || [])];
                                          const options = e.target.value.split(',').map((o) => o.trim()).filter(Boolean);
                                          subFields[subIndex] = { 
                                            ...subFields[subIndex], 
                                            field_options: { ...(subFields[subIndex]?.field_options || {}), options }
                                          };
                                          updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                        }}
                                        placeholder="Yes, No, N/A"
                                      />
                                    </div>
                                  )}

                                  {/* Button (Pass/Hold) */}
                                  {(subField.field_type === FieldType.BUTTON || subField.field_types?.includes(FieldType.BUTTON)) && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900 mb-2">Button Options</label>
                                      <div className="space-y-2">
                                        {((subField.field_options?.button_options) || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]).map((btn: any, btnIdx: number) => (
                                          <div key={btnIdx} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                                            <input
                                              type="text"
                                              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                              placeholder="Button Label"
                                              value={btn.label}
                                              onChange={(e) => {
                                                const subFields = [...(field.field_options?.subform_fields || [])];
                                                const options = [ ...(subField.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]) ];
                                                options[btnIdx] = { ...options[btnIdx], label: e.target.value };
                                                subFields[subIndex] = { 
                                                  ...subFields[subIndex], 
                                                  field_options: { ...(subFields[subIndex]?.field_options || {}), button_options: options }
                                                };
                                                updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                              }}
                                            />
                                            <select
                                              className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                              value={btn.color}
                                              onChange={(e) => {
                                                const subFields = [...(field.field_options?.subform_fields || [])];
                                                const options = [ ...(subField.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]) ];
                                                options[btnIdx] = { ...options[btnIdx], color: e.target.value };
                                                subFields[subIndex] = { 
                                                  ...subFields[subIndex], 
                                                  field_options: { ...(subFields[subIndex]?.field_options || {}), button_options: options }
                                                };
                                                updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                              }}
                                            >
                                              <option value="green">Green</option>
                                              <option value="yellow">Yellow</option>
                                              <option value="red">Red</option>
                                              <option value="blue">Blue</option>
                                              <option value="gray">Gray</option>
                                            </select>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const subFields = [...(field.field_options?.subform_fields || [])];
                                                const options = (subField.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]).filter((_: any, i: number) => i !== btnIdx);
                                                subFields[subIndex] = { 
                                                  ...subFields[subIndex], 
                                                  field_options: { ...(subFields[subIndex]?.field_options || {}), button_options: options }
                                                };
                                                updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                              }}
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            const options = [ ...(subField.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]), {label: '', color: 'gray'} ];
                                            subFields[subIndex] = { 
                                              ...subFields[subIndex], 
                                              field_options: { ...(subFields[subIndex]?.field_options || {}), button_options: options }
                                            };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          + Add Button Option
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Photo */}
                                  {(subField.field_type === FieldType.PHOTO || subField.field_types?.includes(FieldType.PHOTO)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Max File Size (MB)</label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={50}
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={subField.field_options?.max_size_mb || 5}
                                          onChange={(e) => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            subFields[subIndex] = { 
                                              ...subFields[subIndex], 
                                              field_options: { ...(subFields[subIndex]?.field_options || {}), max_size_mb: parseInt(e.target.value) }
                                            };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Image Quality</label>
                                        <select
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={subField.field_options?.quality || 'medium'}
                                          onChange={(e) => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            subFields[subIndex] = { 
                                              ...subFields[subIndex], 
                                              field_options: { ...(subFields[subIndex]?.field_options || {}), quality: e.target.value }
                                            };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                        >
                                          <option value="low">Low (50%)</option>
                                          <option value="medium">Medium (70%)</option>
                                          <option value="high">High (90%)</option>
                                          <option value="original">Original</option>
                                        </select>
                                      </div>
                                    </div>
                                  )}

                                  {/* Signature */}
                                  {(subField.field_type === FieldType.SIGNATURE || subField.field_types?.includes(FieldType.SIGNATURE)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                      <label className="flex items-center space-x-2 text-xs text-gray-900">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                          checked={subField.field_options?.require_name || false}
                                          onChange={(e) => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            subFields[subIndex] = { 
                                              ...subFields[subIndex], 
                                              field_options: { ...(subFields[subIndex]?.field_options || {}), require_name: e.target.checked }
                                            };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                        />
                                        <span>Require Name</span>
                                      </label>
                                      <label className="flex items-center space-x-2 text-xs text-gray-900">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                          checked={subField.field_options?.require_date || false}
                                          onChange={(e) => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            subFields[subIndex] = { 
                                              ...subFields[subIndex], 
                                              field_options: { ...(subFields[subIndex]?.field_options || {}), require_date: e.target.checked }
                                            };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                        />
                                        <span>Auto-add Date/Time</span>
                                      </label>
                                    </div>
                                  )}

                                  {/* Measurement */}
                                  {(subField.field_type === FieldType.MEASUREMENT || subField.field_types?.includes(FieldType.MEASUREMENT)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Measurement Type</label>
                                        <select
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={subField.measurement_type || MeasurementType.BETWEEN}
                                          onChange={(e) => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            subFields[subIndex] = { ...subFields[subIndex], measurement_type: e.target.value };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                        >
                                          <option value={MeasurementType.BETWEEN}>Between (Min-Max)</option>
                                          <option value={MeasurementType.HIGHER}>Higher Than (Min only)</option>
                                          <option value={MeasurementType.LOWER}>Lower Than (Max only)</option>
                                        </select>
                                      </div>

                                      {(subField.measurement_type === MeasurementType.BETWEEN || subField.measurement_type === MeasurementType.HIGHER || !subField.measurement_type) && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-900">Min Value{subField.measurement_type === MeasurementType.HIGHER && ' *'}</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                            value={subField.measurement_min || ''}
                                            onChange={(e) => {
                                              const subFields = [...(field.field_options?.subform_fields || [])];
                                              subFields[subIndex] = { ...subFields[subIndex], measurement_min: parseFloat(e.target.value) };
                                              updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                            }}
                                          />
                                        </div>
                                      )}

                                      {(subField.measurement_type === MeasurementType.BETWEEN || subField.measurement_type === MeasurementType.LOWER || !subField.measurement_type) && (
                                        <div>
                                          <label className="block text-xs font-medium text-gray-900">Max Value{subField.measurement_type === MeasurementType.LOWER && ' *'}</label>
                                          <input
                                            type="number"
                                            step="0.01"
                                            className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                            value={subField.measurement_max || ''}
                                            onChange={(e) => {
                                              const subFields = [...(field.field_options?.subform_fields || [])];
                                              subFields[subIndex] = { ...subFields[subIndex], measurement_max: parseFloat(e.target.value) };
                                              updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Notes */}
                                  {(subField.field_type === FieldType.NOTES || subField.field_types?.includes(FieldType.NOTES)) && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900">Instructions/Notes</label>
                                      <textarea
                                        className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        rows={2}
                                        value={subField.placeholder_text || ''}
                                        onChange={(e) => {
                                          const subFields = [...(field.field_options?.subform_fields || [])];
                                          subFields[subIndex] = { ...subFields[subIndex], placeholder_text: e.target.value };
                                          updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                        }}
                                        placeholder="Instructions for the inspector..."
                                      />
                                    </div>
                                  )}

                                  {/* Date / Datetime / Time */}
                                  {(subField.field_type === FieldType.DATE || subField.field_type === FieldType.DATETIME || subField.field_type === FieldType.TIME) && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Default Value</label>
                                        <select
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={subField.field_options?.default_value || 'none'}
                                          onChange={(e) => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            subFields[subIndex] = { 
                                              ...subFields[subIndex], 
                                              field_options: { ...(subFields[subIndex]?.field_options || {}), default_value: e.target.value }
                                            };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                        >
                                          <option value="none">None</option>
                                          <option value="today">Today/Now</option>
                                          <option value="custom">Custom</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Min Date</label>
                                        <input
                                          type="date"
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={subField.field_options?.min_date || ''}
                                          onChange={(e) => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            subFields[subIndex] = { 
                                              ...subFields[subIndex], 
                                              field_options: { ...(subFields[subIndex]?.field_options || {}), min_date: e.target.value }
                                            };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Max Date</label>
                                        <input
                                          type="date"
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={subField.field_options?.max_date || ''}
                                          onChange={(e) => {
                                            const subFields = [...(field.field_options?.subform_fields || [])];
                                            subFields[subIndex] = { 
                                              ...subFields[subIndex], 
                                              field_options: { ...(subFields[subIndex]?.field_options || {}), max_date: e.target.value }
                                            };
                                            updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Subform-level Conditional Logic */}
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="block text-xs font-medium text-gray-900">Conditional Logic (inside Subform)</label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const subFields = [...(field.field_options?.subform_fields || [])];
                                          const conditions = subField.conditional_logic || [];
                                          subFields[subIndex] = { 
                                            ...subFields[subIndex], 
                                            conditional_logic: [...conditions, { field_index: '', dropdown_value: '', field_types: [], field_type: '' }]
                                          };
                                          updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                        }}
                                        className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                      >
                                        + Add Condition
                                      </button>
                                    </div>

                                    {(subField.conditional_logic && subField.conditional_logic.length > 0) && (
                                      <div className="space-y-4">
                                        {subField.conditional_logic.map((cond: any, sCondIdx: number) => (
                                          <div key={sCondIdx} className="space-y-3">
                                          <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <div className="grid grid-cols-3 gap-2 mb-2">
                                            {/* Field Name */}
                                            <div>
                                              <label className="block text-xs font-medium text-gray-900 mb-1">Field Name</label>
                                              <select
                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                value={cond.field_index !== undefined ? cond.field_index : ''}
                                                onChange={(e) => {
                                                  const subFields = [...(field.field_options?.subform_fields || [])];
                                                  const cl = [...(subField.conditional_logic || [])];
                                                  cl[sCondIdx] = { ...cl[sCondIdx], field_index: parseInt(e.target.value) };
                                                  subFields[subIndex] = { ...subFields[subIndex], conditional_logic: cl };
                                                  updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                                }}
                                              >
                                                <option value="">Select Field</option>
                                                {(field.field_options?.subform_fields || []).slice(0, subIndex).map((sf: any, i: number) => (
                                                  <option key={i} value={i}>{sf.field_name || `Field #${i + 1}`}</option>
                                                ))}
                                              </select>
                                            </div>

                                            {/* When Value Equals */}
                                            <div>
                                              <label className="block text-xs font-medium text-gray-900 mb-1">When Value Equals</label>
                                              <select
                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                value={cond.dropdown_value || ''}
                                                onChange={(e) => {
                                                  const subFields = [...(field.field_options?.subform_fields || [])];
                                                  const cl = [...(subField.conditional_logic || [])];
                                                  cl[sCondIdx] = { ...cl[sCondIdx], dropdown_value: e.target.value };
                                                  subFields[subIndex] = { ...subFields[subIndex], conditional_logic: cl };
                                                  updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                                }}
                                              >
                                                <option value="">Any value</option>
                                                {cond.field_index !== undefined && (field.field_options?.subform_fields || [])[cond.field_index]?.field_options?.options?.map((opt: string, optIdx: number) => (
                                                  <option key={optIdx} value={opt}>{opt}</option>
                                                ))}
                                              </select>
                                            </div>

                                            {/* Delete Button */}
                                            <div className="flex items-end">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const subFields = [...(field.field_options?.subform_fields || [])];
                                                  const cl = (subField.conditional_logic || []).filter((_: any, i: number) => i !== sCondIdx);
                                                  subFields[subIndex] = { ...subFields[subIndex], conditional_logic: cl };
                                                  updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                                }}
                                                className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300"
                                              >
                                                🗑️ Delete
                                              </button>
                                            </div>
                                          </div>

                                          {/* Field Types Checkbox */}
                                          <div className="mt-2">
                                            <label className="block text-xs font-medium text-gray-900 mb-1">Field Types</label>
                                            <div className="grid grid-cols-2 gap-2 p-2 border border-gray-300 rounded bg-gray-50">
                                              {[
                                                { value: FieldType.TEXT, label: 'Text' },
                                                { value: FieldType.DROPDOWN, label: 'Dropdown' },
                                                { value: FieldType.SEARCH_DROPDOWN, label: 'Search Dropdown' },
                                                { value: FieldType.BUTTON, label: 'Button' },
                                                { value: FieldType.PHOTO, label: 'Photo' },
                                                { value: FieldType.SIGNATURE, label: 'Signature' },
                                                { value: FieldType.MEASUREMENT, label: 'Measurement' },
                                                { value: FieldType.NOTES, label: 'Notes' },
                                                { value: FieldType.DATE, label: 'Date' },
                                                { value: FieldType.DATETIME, label: 'Date & Time' },
                                                { value: FieldType.TIME, label: 'Time' },
                                              ].map((type) => (
                                                <label key={type.value} className="flex items-center space-x-2 text-xs text-gray-900">
                                                  <input
                                                    type="checkbox"
                                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                    checked={(cond.field_types || []).includes(type.value) || cond.field_type === type.value}
                                                    onChange={(e) => {
                                                      const subFields = [...(field.field_options?.subform_fields || [])];
                                                      const cl = [...(subField.conditional_logic || [])];
                                                      const current = (cl[sCondIdx]?.field_types) || (cl[sCondIdx]?.field_type ? [cl[sCondIdx]?.field_type] : []);
                                                      const next = e.target.checked
                                                        ? Array.from(new Set([...current, type.value]))
                                                        : current.filter((t: any) => t !== type.value);
                                                      cl[sCondIdx] = { ...cl[sCondIdx], field_types: next };
                                                      subFields[subIndex] = { ...subFields[subIndex], conditional_logic: cl };
                                                      updateField(index, { field_options: { ...field.field_options, subform_fields: subFields } });
                                                    }}
                                                  />
                                                  <span>{type.label}</span>
                                                </label>
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                        ))}
                                        <p className="text-xs text-gray-900 mt-2">This subform field will only show when conditions are met</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              <button
                                type="button"
                                onClick={() => {
                                  const subFields = [...(field.field_options?.subform_fields || []), { field_name: '', field_type: '' }];
                                  updateField(index, { 
                                    field_options: { ...field.field_options, subform_fields: subFields } 
                                  });
                                }}
                                className="w-full text-xs px-3 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200 border-dashed"
                              >
                                + Add Subform Field
                              </button>
                              
                              <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                                <p className="text-xs text-blue-800">
                                  <strong>💡 Example:</strong> For "Defect Details" subform, you might add:
                                  <br />• Defect Type (Dropdown)
                                  <br />• Defect Location (Text)  
                                  <br />• Defect Photo (Photo)
                                  <br />• Severity (Dropdown)
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Conditional Logic Section - Only for Dropdown/Search Dropdown */}
                        {(field.field_type === FieldType.DROPDOWN || field.field_type === FieldType.SEARCH_DROPDOWN || field.field_types?.includes(FieldType.DROPDOWN) || field.field_types?.includes(FieldType.SEARCH_DROPDOWN)) && (
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-900">
                              🔀 Conditional Logic (Show this field only if...)
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                const conditions = field.field_options?.conditional_logic || [];
                                updateField(index, {
                                  field_options: {
                                    ...field.field_options,
                                    // Initialize with field_types for multi-select; keep field_type for backward compatibility
                                    conditional_logic: [...conditions, { field_name: '', field_types: [], field_type: '' }]
                                  }
                                });
                              }}
                              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              + Add Condition
                            </button>
                          </div>
                          <p className="text-xs text-gray-900 mb-3">
                            💡 Use this for dropdown-based branching: Show different follow-up questions based on dropdown selection
                          </p>
                          
                          {field.field_options?.conditional_logic && field.field_options.conditional_logic.length > 0 && (
                            <div className="space-y-4">
                              {field.field_options.conditional_logic.map((condition: any, condIndex: number) => (
                                <div key={condIndex} className="space-y-3">
                                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                  <div className="grid grid-cols-3 gap-2 mb-2">
                                    {/* Field Name */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900 mb-1">Field Name</label>
                                      <input
                                        type="text"
                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        placeholder="Enter field name"
                                        value={condition.field_name || ''}
                                        onChange={(e) => {
                                          const conditions = [...(field.field_options?.conditional_logic || [])];
                                          conditions[condIndex] = { ...conditions[condIndex], field_name: e.target.value };
                                          updateField(index, {
                                            field_options: { ...field.field_options, conditional_logic: conditions }
                                          });
                                        }}
                                      />
                                    </div>

                                    {/* Dropdown Value Selection */}
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900 mb-1">When Value Equals</label>
                                      <select
                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        value={condition.dropdown_value || ''}
                                        onChange={(e) => {
                                          const conditions = [...(field.field_options?.conditional_logic || [])];
                                          conditions[condIndex] = { ...conditions[condIndex], dropdown_value: e.target.value };
                                          updateField(index, {
                                            field_options: { ...field.field_options, conditional_logic: conditions }
                                          });
                                        }}
                                      >
                                        <option value="">Any value</option>
                                        {(field.field_options?.options || []).map((opt: string, optIdx: number) => (
                                          <option key={optIdx} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    </div>

                                    {/* Delete Button */}
                                    <div className="flex items-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const conditions = (field.field_options?.conditional_logic || []).filter((_: any, i: number) => i !== condIndex);
                                          updateField(index, {
                                            field_options: { ...field.field_options, conditional_logic: conditions }
                                          });
                                        }}
                                        className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  </div>

                                  {/* Field Types */}
                                  <div className="flex-1">
                                    <label className="block text-xs font-medium text-gray-900 mb-1">Field Types</label>
                                    <div className="grid grid-cols-2 gap-2 p-2 border border-gray-300 rounded bg-gray-50">
                                      {[
                                        { value: FieldType.TEXT, label: 'Text' },
                                        { value: FieldType.DROPDOWN, label: 'Dropdown' },
                                        { value: FieldType.SEARCH_DROPDOWN, label: 'Search Dropdown' },
                                        { value: FieldType.BUTTON, label: 'Button' },
                                        { value: FieldType.PHOTO, label: 'Photo' },
                                        { value: FieldType.SIGNATURE, label: 'Signature' },
                                        { value: FieldType.MEASUREMENT, label: 'Measurement' },
                                        { value: FieldType.NOTES, label: 'Notes' },
                                        { value: FieldType.DATE, label: 'Date' },
                                        { value: FieldType.DATETIME, label: 'Date & Time' },
                                        { value: FieldType.TIME, label: 'Time' },
                                        // SUBFORM is not a user-entered field type for conditions typically; omit here
                                      ].map((type) => (
                                        <label key={type.value} className="flex items-center space-x-2 text-xs text-gray-900">
                                          <input
                                            type="checkbox"
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            checked={(condition.field_types || []).includes(type.value) || condition.field_type === type.value}
                                            onChange={(e) => {
                                              const conditions = [...(field.field_options?.conditional_logic || [])];
                                              const current = (conditions[condIndex]?.field_types) || (conditions[condIndex]?.field_type ? [conditions[condIndex]?.field_type] : []);
                                              const next = e.target.checked
                                                ? Array.from(new Set([...current, type.value]))
                                                : current.filter((t: any) => t !== type.value);
                                              conditions[condIndex] = { ...conditions[condIndex], field_types: next };
                                              updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                            }}
                                          />
                                          <span>{type.label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Per-Type Adjustments for Conditional Logic */}
                                <div className="col-span-full space-y-3 mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                                  <p className="text-xs font-medium text-blue-900">⚙️ Settings for selected field types:</p>
                                  
                                  {/* Dropdown/Search Dropdown Options */}
                                  {((condition.field_types || []).includes(FieldType.DROPDOWN) || (condition.field_types || []).includes(FieldType.SEARCH_DROPDOWN) || condition.field_type === FieldType.DROPDOWN || condition.field_type === FieldType.SEARCH_DROPDOWN) && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900">Dropdown Options (comma-separated)</label>
                                      <input
                                        type="text"
                                        className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        placeholder="Option 1, Option 2, Option 3"
                                        value={(condition.options || []).join(', ')}
                                        onChange={(e) => {
                                          const conditions = [...(field.field_options?.conditional_logic || [])];
                                          const options = e.target.value.split(',').map(o => o.trim()).filter(Boolean);
                                          conditions[condIndex] = { ...conditions[condIndex], options };
                                          updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Photo Settings */}
                                  {((condition.field_types || []).includes(FieldType.PHOTO) || condition.field_type === FieldType.PHOTO) && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Max File Size (MB)</label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={50}
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={condition.max_size_mb || 5}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], max_size_mb: parseInt(e.target.value) };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Image Quality</label>
                                        <select
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={condition.quality || 'medium'}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], quality: e.target.value };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        >
                                          <option value="low">Low (50%)</option>
                                          <option value="medium">Medium (70%)</option>
                                          <option value="high">High (90%)</option>
                                          <option value="original">Original</option>
                                        </select>
                                      </div>
                                    </div>
                                  )}

                                  {/* Button Options */}
                                  {((condition.field_types || []).includes(FieldType.BUTTON) || condition.field_type === FieldType.BUTTON) && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900 mb-2">Button Options</label>
                                      <div className="space-y-2">
                                        {((condition.button_options) || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]).map((btn: any, btnIdx: number) => (
                                          <div key={btnIdx} className="flex items-center space-x-2 bg-white p-2 rounded">
                                            <input
                                              type="text"
                                              className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                                              placeholder="Button Label"
                                              value={btn.label}
                                              onChange={(e) => {
                                                const conditions = [...(field.field_options?.conditional_logic || [])];
                                                const options = [...(condition.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}])];
                                                options[btnIdx] = { ...options[btnIdx], label: e.target.value };
                                                conditions[condIndex] = { ...conditions[condIndex], button_options: options };
                                                updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                              }}
                                            />
                                            <select
                                              className="text-xs border border-gray-300 rounded px-2 py-1"
                                              value={btn.color}
                                              onChange={(e) => {
                                                const conditions = [...(field.field_options?.conditional_logic || [])];
                                                const options = [...(condition.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}])];
                                                options[btnIdx] = { ...options[btnIdx], color: e.target.value };
                                                conditions[condIndex] = { ...conditions[condIndex], button_options: options };
                                                updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                              }}
                                            >
                                              <option value="green">Green</option>
                                              <option value="yellow">Yellow</option>
                                              <option value="red">Red</option>
                                              <option value="blue">Blue</option>
                                            </select>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const conditions = [...(field.field_options?.conditional_logic || [])];
                                                const options = (condition.button_options || []).filter((_: any, i: number) => i !== btnIdx);
                                                conditions[condIndex] = { ...conditions[condIndex], button_options: options };
                                                updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                              }}
                                              className="text-red-600 hover:text-red-800"
                                            >
                                              <TrashIcon className="h-4 w-4" />
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            const options = [...(condition.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]), {label: '', color: 'gray'}];
                                            conditions[condIndex] = { ...conditions[condIndex], button_options: options };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                          + Add Button
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Signature Settings */}
                                  {((condition.field_types || []).includes(FieldType.SIGNATURE) || condition.field_type === FieldType.SIGNATURE) && (
                                    <div className="grid grid-cols-2 gap-2">
                                      <label className="flex items-center space-x-2 text-xs">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                          checked={condition.require_name || false}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], require_name: e.target.checked };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        />
                                        <span>Require Name</span>
                                      </label>
                                      <label className="flex items-center space-x-2 text-xs">
                                        <input
                                          type="checkbox"
                                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                          checked={condition.require_date || false}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], require_date: e.target.checked };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        />
                                        <span>Auto-add Date/Time</span>
                                      </label>
                                    </div>
                                  )}

                                  {/* Measurement Settings */}
                                  {((condition.field_types || []).includes(FieldType.MEASUREMENT) || condition.field_type === FieldType.MEASUREMENT) && (
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Measurement Type</label>
                                        <select
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1"
                                          value={condition.measurement_type || MeasurementType.BETWEEN}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], measurement_type: e.target.value };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        >
                                          <option value={MeasurementType.BETWEEN}>Between</option>
                                          <option value={MeasurementType.HIGHER}>Higher Than</option>
                                          <option value={MeasurementType.LOWER}>Lower Than</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Min Value</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1"
                                          value={condition.measurement_min || ''}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], measurement_min: parseFloat(e.target.value) };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Max Value</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1"
                                          value={condition.measurement_max || ''}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], measurement_max: parseFloat(e.target.value) };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Date/DateTime/Time Settings */}
                                  {((condition.field_types || []).includes(FieldType.DATE) || (condition.field_types || []).includes(FieldType.DATETIME) || (condition.field_types || []).includes(FieldType.TIME) || condition.field_type === FieldType.DATE || condition.field_type === FieldType.DATETIME || condition.field_type === FieldType.TIME) && (
                                    <div className="grid grid-cols-3 gap-2">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Default Value</label>
                                        <select
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1"
                                          value={condition.default_value || 'none'}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], default_value: e.target.value };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        >
                                          <option value="none">None</option>
                                          <option value="today">Today/Now</option>
                                          <option value="custom">Custom</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Min Date</label>
                                        <input
                                          type="date"
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={condition.min_date || ''}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], min_date: e.target.value };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-900">Max Date</label>
                                        <input
                                          type="date"
                                          className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                          value={condition.max_date || ''}
                                          onChange={(e) => {
                                            const conditions = [...(field.field_options?.conditional_logic || [])];
                                            conditions[condIndex] = { ...conditions[condIndex], max_date: e.target.value };
                                            updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                          }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Notes/Instructions */}
                                  {((condition.field_types || []).includes(FieldType.NOTES) || condition.field_type === FieldType.NOTES) && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900">Instructions/Notes</label>
                                      <textarea
                                        className="mt-1 w-full text-xs border border-gray-300 rounded px-2 py-1"
                                        rows={2}
                                        placeholder="Instructions for the inspector..."
                                        value={condition.placeholder_text || ''}
                                        onChange={(e) => {
                                          const conditions = [...(field.field_options?.conditional_logic || [])];
                                          conditions[condIndex] = { ...conditions[condIndex], placeholder_text: e.target.value };
                                          updateField(index, { field_options: { ...field.field_options, conditional_logic: conditions } });
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>
                                </div>
                              ))}
                              <p className="text-xs text-gray-700 mt-2">
                                This field will only show when conditions are met
                              </p>
                            </div>
                          )}
                        </div>
                        )}
                      </div>
                      )}
                    </div>
                    </React.Fragment>
                  ))}
                  
                  {/* Add Field Button at Bottom */}
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => addField()}
                      className="text-sm px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border-2 border-blue-300 border-dashed font-medium"
                    >
                      + Add Field at Bottom
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.push('/forms')}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Form'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}

export default function NewFormPage() {
  return (
    <LayoutWrapper>
      <NewFormContent />
    </LayoutWrapper>
  );
}
