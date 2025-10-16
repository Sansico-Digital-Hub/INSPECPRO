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
    setFields([...fields, {
      field_name: '',
      field_type: FieldType.TEXT,
      field_types: [],
      field_options: {},
      is_required: false,
      field_order: fields.length,
      has_conditional: false,
      conditional_rules: []
    }]);
  };

  // Helper function untuk update nested conditional rules di level manapun
  const updateNestedConditionalByPath = (fieldIndex: number, path: number[], updater: (rules: any[]) => any[]) => {
    const newFields = [...fields];
    let current = newFields[fieldIndex];

    // Pastikan struktur awal ada
    if (!current.conditional_rules) current.conditional_rules = [];

    // Path format: [rootIndex, ruleIndex, nextFieldIndex, ruleIndex, nextFieldIndex, ...]
    // Mulai dari pasangan pertama setelah rootIndex, navigasi sampai parent dari target
    for (let i = 1; i < path.length - 2; i += 2) {
      const ruleIdx = path[i];
      const nextFldIdx = path[i + 1];

      // Init rule container
      if (!current.conditional_rules[ruleIdx]) {
        current.conditional_rules[ruleIdx] = { condition_value: '', next_fields: [] };
      }
      if (!current.conditional_rules[ruleIdx].next_fields) {
        current.conditional_rules[ruleIdx].next_fields = [];
      }
      // Init the next field at this level if missing
      if (!current.conditional_rules[ruleIdx].next_fields[nextFldIdx]) {
        current.conditional_rules[ruleIdx].next_fields[nextFldIdx] = {
          field_name: '',
          field_type: FieldType.TEXT,
          field_types: [],
          field_options: {},
          is_required: false,
          field_order: nextFldIdx,
          has_conditional: false,
          conditional_rules: []
        } as any;
      }
      // Descend
      current = current.conditional_rules[ruleIdx].next_fields[nextFldIdx] as any;
      if (!current.conditional_rules) current.conditional_rules = [];
    }

    // Sekarang current adalah parent dari target pair (targetRuleIndex, targetFieldIndex)
    if (path.length >= 3) {
      const targetRuleIndex = path[path.length - 2];
      const targetFieldIndex = path[path.length - 1];

      if (!current.conditional_rules[targetRuleIndex]) {
        current.conditional_rules[targetRuleIndex] = { condition_value: '', next_fields: [] };
      }
      if (!current.conditional_rules[targetRuleIndex].next_fields) {
        current.conditional_rules[targetRuleIndex].next_fields = [];
      }
      if (!current.conditional_rules[targetRuleIndex].next_fields[targetFieldIndex]) {
        current.conditional_rules[targetRuleIndex].next_fields[targetFieldIndex] = {
          field_name: '',
          field_type: FieldType.TEXT,
          field_types: [],
          field_options: {},
          is_required: false,
          field_order: targetFieldIndex,
          has_conditional: false,
          conditional_rules: []
        } as any;
      }

      const targetField = current.conditional_rules[targetRuleIndex].next_fields[targetFieldIndex] as any;
      targetField.conditional_rules = updater(targetField.conditional_rules || []);
      targetField.has_conditional = (targetField.conditional_rules || []).length > 0;
    }

    setFields(newFields);
  };

  // Recursive component untuk render nested conditional fields
  const renderNestedConditionalFields = (
    nestedField: any, 
    path: number[], 
    depth: number = 0
  ) => {
    const depthColors = [
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', button: 'bg-purple-600 hover:bg-purple-700' },
      { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-900', button: 'bg-indigo-600 hover:bg-indigo-700' },
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', button: 'bg-blue-600 hover:bg-blue-700' },
      { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900', button: 'bg-cyan-600 hover:bg-cyan-700' },
      { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-900', button: 'bg-teal-600 hover:bg-teal-700' },
      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', button: 'bg-green-600 hover:bg-green-700' },
    ];
    
    const colorScheme = depthColors[depth % depthColors.length];
    const fontSize = Math.max(8, 12 - depth);
    
    if (!((nestedField.field_types || []).includes(FieldType.DROPDOWN) || 
          (nestedField.field_types || []).includes(FieldType.SEARCH_DROPDOWN))) {
      return null;
    }

    return (
      <div className={`mt-1 pt-1 border-t ${colorScheme.border}`}>
        <div className="flex items-center justify-between mb-1">
          <label className={`block text-[${fontSize}px] font-medium text-black`}>
            🔀 Deeper Nesting (Level {depth + 1})
          </label>
          <button
            type="button"
            onClick={() => {
              updateNestedConditionalByPath(path[0], path.slice(1), (rules) => [
                ...rules,
                { condition_value: '', next_fields: [] }
              ]);
            }}
            className={`text-[${fontSize}px] px-1 py-0.5 ${colorScheme.button} text-white rounded`}
          >
            + Add Condition
          </button>
        </div>
        
        {nestedField.has_conditional && nestedField.conditional_rules && nestedField.conditional_rules.length > 0 && (
          <div className={`mt-1 space-y-1 pl-2 border-l-2 ${colorScheme.border}`}>
            {nestedField.conditional_rules.map((deeperRule: any, deeperRuleIndex: number) => (
              <div key={deeperRuleIndex} className={`${colorScheme.bg} p-1 rounded border ${colorScheme.border} text-[${Math.max(7, fontSize - 1)}px]`}>
                <div className="flex items-center justify-between mb-0.5">
                  <select
                    className={`flex-1 text-[${Math.max(7, fontSize - 1)}px] border border-gray-300 rounded px-0.5 py-0.5 text-black mr-0.5 bg-white`}
                    value={deeperRule.condition_value || ''}
                    onChange={(e) => {
                      updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                        const newRules = [...rules];
                        newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], condition_value: e.target.value };
                        return newRules;
                      });
                    }}
                  >
                    <option value="">Select value...</option>
                    {((nestedField.field_options?.options || []) as string[]).map((opt: string, optIdx: number) => (
                      <option key={optIdx} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      updateNestedConditionalByPath(path[0], path.slice(1), (rules) => {
                        const newRules = rules.filter((_, i) => i !== deeperRuleIndex);
                        return newRules;
                      });
                    }}
                    className={`px-0.5 py-0.5 text-[${Math.max(7, fontSize - 1)}px] text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300 bg-white`}
                  >
                    🗑️
                  </button>
                </div>
                
                <div className={`text-[${Math.max(6, fontSize - 2)}px] text-black italic`}>
                  📋 Fields: {deeperRule.next_fields?.length || 0}
                </div>
                
                <div className="mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`block text-[${Math.max(7, fontSize - 1)}px] font-medium text-black`}>
                      📋 Fields for "{deeperRule.condition_value || 'this value'}":
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                          const newRules = [...rules];
                          const deeperFields = newRules[deeperRuleIndex]?.next_fields || [];
                          newRules[deeperRuleIndex] = {
                            ...newRules[deeperRuleIndex],
                            next_fields: [...deeperFields, {
                              field_name: '',
                              field_type: FieldType.TEXT,
                              field_types: [],
                              field_options: {},
                              is_required: false,
                              field_order: deeperFields.length,
                              has_conditional: false,
                              conditional_rules: []
                            }]
                          };
                          return newRules;
                        });
                      }}
                      className={`text-[${Math.max(7, fontSize - 1)}px] px-1.5 py-0.5 bg-green-600 text-white rounded hover:bg-green-700`}
                    >
                      + Add Field
                    </button>
                  </div>
                  
                  {deeperRule.next_fields && deeperRule.next_fields.length > 0 ? (
                    <div className={`space-y-1 pl-2 border-l-2 ${colorScheme.border}`}>
                      {deeperRule.next_fields.map((deeperField: any, deeperFieldIndex: number) => (
                        <div key={deeperFieldIndex} className="bg-white p-1.5 rounded border border-gray-200">
                          {/* Field Name and Delete */}
                          <div className="grid grid-cols-2 gap-1 mb-1">
                            <div>
                              <label className={`block text-[${Math.max(7, fontSize - 1)}px] font-medium text-black mb-0.5`}>Field Name</label>
                              <input
                                type="text"
                                className={`w-full text-[${Math.max(7, fontSize - 1)}px] border border-gray-300 rounded px-1 py-0.5 text-black bg-white`}
                                placeholder="Enter field name"
                                value={deeperField.field_name || ''}
                                onChange={(e) => {
                                  updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                    const newRules = [...rules];
                                    const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                    deeperFields[deeperFieldIndex] = { ...deeperFields[deeperFieldIndex], field_name: e.target.value };
                                    newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                    return newRules;
                                  });
                                }}
                              />
                            </div>
                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => {
                                  updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                    const newRules = [...rules];
                                    const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])].filter((_, i) => i !== deeperFieldIndex);
                                    newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                    return newRules;
                                  });
                                }}
                                className={`w-full px-1 py-0.5 text-[${Math.max(7, fontSize - 1)}px] text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300 bg-white`}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                          
                          {/* Field Types */}
                          <div>
                            <label className={`block text-[${Math.max(7, fontSize - 1)}px] font-medium text-black mb-0.5`}>Field Types</label>
                            <div className="grid grid-cols-4 gap-1 p-1 border border-gray-300 rounded bg-gray-50">
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
                                <label key={type.value} className={`flex items-center space-x-0.5 text-[${Math.max(6, fontSize - 2)}px] text-black`}>
                                  <input
                                    type="checkbox"
                                    className="h-2.5 w-2.5 text-blue-600 border-gray-300 rounded"
                                    checked={(deeperField.field_types || []).includes(type.value)}
                                    onChange={(e) => {
                                      updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                        const newRules = [...rules];
                                        const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                        const current = deeperFields[deeperFieldIndex].field_types || [];
                                        const next = e.target.checked ? [...current, type.value] : current.filter((t: any) => t !== type.value);
                                        deeperFields[deeperFieldIndex] = { 
                                          ...deeperFields[deeperFieldIndex], 
                                          field_types: next, 
                                          field_type: next[0] || FieldType.TEXT 
                                        };
                                        newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                        return newRules;
                                      });
                                    }}
                                  />
                                  <span className={`text-[${Math.max(6, fontSize - 2)}px]`}>{type.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          {/* Required Checkbox */}
                          <div className="mt-1">
                            <label className={`flex items-center space-x-1 text-[${Math.max(7, fontSize - 1)}px] text-black`}>
                              <input
                                type="checkbox"
                                className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                                checked={deeperField.is_required || false}
                                onChange={(e) => {
                                  updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                    const newRules = [...rules];
                                    const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                    deeperFields[deeperFieldIndex] = { ...deeperFields[deeperFieldIndex], is_required: e.target.checked };
                                    newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                    return newRules;
                                  });
                                }}
                              />
                              <span>Required field</span>
                            </label>
                          </div>

                          {/* Dropdown Options */}
                          {((deeperField.field_types || []).includes(FieldType.DROPDOWN) || (deeperField.field_types || []).includes(FieldType.SEARCH_DROPDOWN)) && (
                            <div className="mt-1">
                              <label className={`block text-[${Math.max(7, fontSize - 1)}px] font-medium text-black mb-0.5`}>Dropdown Options (comma-separated)</label>
                              <input
                                type="text"
                                className={`w-full text-[${Math.max(7, fontSize - 1)}px] border border-gray-300 rounded px-1 py-0.5 text-black bg-white`}
                                placeholder="Option 1, Option 2, Option 3"
                                value={deeperField.field_options?.dropdown_input || ((deeperField.field_options?.options || []) as string[]).join(', ')}
                                onChange={(e) => {
                                  updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                    const newRules = [...rules];
                                    const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                    const inputValue = e.target.value;
                                    const options = inputValue.split(',').map(o => o.trim()).filter(Boolean);
                                    deeperFields[deeperFieldIndex] = { 
                                      ...deeperFields[deeperFieldIndex], 
                                      field_options: { 
                                        ...deeperFields[deeperFieldIndex].field_options, 
                                        dropdown_input: inputValue,
                                        options 
                                      } 
                                    };
                                    newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                    return newRules;
                                  });
                                }}
                              />
                            </div>
                          )}

                          {/* Placeholder Text */}
                          <div className="mt-1">
                            <label className={`block text-[${Math.max(7, fontSize - 1)}px] font-medium text-black mb-0.5`}>Placeholder/Instructions</label>
                            <input
                              type="text"
                              className={`w-full text-[${Math.max(7, fontSize - 1)}px] border border-gray-300 rounded px-1 py-0.5 text-black bg-white`}
                              placeholder="Enter placeholder text or instructions"
                              value={deeperField.placeholder_text || ''}
                              onChange={(e) => {
                                updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                  const newRules = [...rules];
                                  const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                  deeperFields[deeperFieldIndex] = { ...deeperFields[deeperFieldIndex], placeholder_text: e.target.value };
                                  newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                  return newRules;
                                });
                              }}
                            />
                          </div>

                          {/* Settings for selected field types */}
                          {(deeperField.field_types || []).length > 0 && (
                            <div className="mt-1 pt-1 border-t border-gray-200">
                              <label className={`block text-[${Math.max(7, fontSize - 1)}px] font-medium text-black mb-1`}>
                                ⚙️ Settings for selected field types:
                              </label>
                              
                              {/* Photo Settings */}
                              {(deeperField.field_types || []).includes(FieldType.PHOTO) && (
                                <div className={`grid grid-cols-2 gap-1 mb-1 p-1 bg-black text-white rounded text-[${Math.max(6, fontSize - 2)}px]`}>
                                  <div>
                                    <label className="block font-medium text-white mb-0.5">Max File Size (MB)</label>
                                    <input
                                      type="number"
                                      min="1"
                                      max="50"
                                      className={`w-full text-[${Math.max(6, fontSize - 2)}px] border border-gray-300 rounded px-1 py-0.5 text-black bg-white`}
                                      value={deeperField.field_options?.max_size_mb || 5}
                                      onChange={(e) => {
                                        updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                          const newRules = [...rules];
                                          const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                          deeperFields[deeperFieldIndex] = { 
                                            ...deeperFields[deeperFieldIndex], 
                                            field_options: { ...deeperFields[deeperFieldIndex].field_options, max_size_mb: parseInt(e.target.value) } 
                                          };
                                          newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                          return newRules;
                                        });
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-medium text-white mb-0.5">Image Quality</label>
                                    <select
                                      className={`w-full text-[${Math.max(6, fontSize - 2)}px] border border-gray-300 rounded px-1 py-0.5 text-black bg-white`}
                                      value={deeperField.field_options?.quality || 'medium'}
                                      onChange={(e) => {
                                        updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                          const newRules = [...rules];
                                          const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                          deeperFields[deeperFieldIndex] = { 
                                            ...deeperFields[deeperFieldIndex], 
                                            field_options: { ...deeperFields[deeperFieldIndex].field_options, quality: e.target.value } 
                                          };
                                          newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                          return newRules;
                                        });
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

                              {/* Measurement Settings */}
                              {(deeperField.field_types || []).includes(FieldType.MEASUREMENT) && (
                                <div className={`grid grid-cols-3 gap-1 mb-1 p-1 bg-black text-white rounded text-[${Math.max(6, fontSize - 2)}px]`}>
                                  <div>
                                    <label className="block font-medium text-white mb-0.5">Measurement Type</label>
                                    <select
                                      className={`w-full text-[${Math.max(6, fontSize - 2)}px] border border-gray-300 rounded px-1 py-0.5 text-black bg-white`}
                                      value={deeperField.measurement_type || 'between'}
                                      onChange={(e) => {
                                        updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                          const newRules = [...rules];
                                          const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                          deeperFields[deeperFieldIndex] = { ...deeperFields[deeperFieldIndex], measurement_type: e.target.value as MeasurementType };
                                          newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                          return newRules;
                                        });
                                      }}
                                    >
                                      <option value="between">Between</option>
                                      <option value="higher">Higher Than</option>
                                      <option value="lower">Lower Than</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block font-medium text-white mb-0.5">Min Value</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className={`w-full text-[${Math.max(6, fontSize - 2)}px] border border-gray-300 rounded px-1 py-0.5 text-black bg-white`}
                                      value={deeperField.measurement_min || ''}
                                      onChange={(e) => {
                                        updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                          const newRules = [...rules];
                                          const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                          deeperFields[deeperFieldIndex] = { ...deeperFields[deeperFieldIndex], measurement_min: parseFloat(e.target.value) };
                                          newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                          return newRules;
                                        });
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label className="block font-medium text-white mb-0.5">Max Value</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      className={`w-full text-[${Math.max(6, fontSize - 2)}px] border border-gray-300 rounded px-1 py-0.5 text-black bg-white`}
                                      value={deeperField.measurement_max || ''}
                                      onChange={(e) => {
                                        updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                          const newRules = [...rules];
                                          const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                          deeperFields[deeperFieldIndex] = { ...deeperFields[deeperFieldIndex], measurement_max: parseFloat(e.target.value) };
                                          newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                          return newRules;
                                        });
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Button Settings */}
                              {(deeperField.field_types || []).includes(FieldType.BUTTON) && (
                                <div className={`mb-1 p-1 bg-black text-white rounded text-[${Math.max(6, fontSize - 2)}px]`}>
                                  <label className="block font-medium text-white mb-0.5">Button Options</label>
                                  <div className="space-y-0.5">
                                    {(deeperField.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]).map((btn: any, btnIdx: number) => (
                                      <div key={btnIdx} className="flex items-center space-x-0.5">
                                        <input
                                          type="text"
                                          className={`flex-1 text-[${Math.max(6, fontSize - 2)}px] border border-gray-300 rounded px-0.5 py-0.5 text-black bg-white`}
                                          placeholder="Label"
                                          value={btn.label}
                                          onChange={(e) => {
                                            updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                              const newRules = [...rules];
                                              const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                              const options = [...(deeperFields[deeperFieldIndex].field_options?.button_options || [])];
                                              options[btnIdx] = { ...options[btnIdx], label: e.target.value };
                                              deeperFields[deeperFieldIndex] = { 
                                                ...deeperFields[deeperFieldIndex], 
                                                field_options: { ...deeperFields[deeperFieldIndex].field_options, button_options: options } 
                                              };
                                              newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                              return newRules;
                                            });
                                          }}
                                        />
                                        <select
                                          className={`text-[${Math.max(6, fontSize - 2)}px] border border-gray-300 rounded px-0.5 py-0.5 text-black bg-white`}
                                          value={btn.color}
                                          onChange={(e) => {
                                            updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                              const newRules = [...rules];
                                              const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                              const options = [...(deeperFields[deeperFieldIndex].field_options?.button_options || [])];
                                              options[btnIdx] = { ...options[btnIdx], color: e.target.value };
                                              deeperFields[deeperFieldIndex] = { 
                                                ...deeperFields[deeperFieldIndex], 
                                                field_options: { ...deeperFields[deeperFieldIndex].field_options, button_options: options } 
                                              };
                                              newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                              return newRules;
                                            });
                                          }}
                                        >
                                          <option value="green">Green</option>
                                          <option value="yellow">Yellow</option>
                                          <option value="red">Red</option>
                                          <option value="blue">Blue</option>
                                          <option value="gray">Gray</option>
                                        </select>
                                      </div>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                          const newRules = [...rules];
                                          const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                          const options = [...(deeperFields[deeperFieldIndex].field_options?.button_options || []), {label: '', color: 'gray'}];
                                          deeperFields[deeperFieldIndex] = { 
                                            ...deeperFields[deeperFieldIndex], 
                                            field_options: { ...deeperFields[deeperFieldIndex].field_options, button_options: options } 
                                          };
                                          newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                          return newRules;
                                        });
                                      }}
                                      className={`text-[${Math.max(6, fontSize - 2)}px] px-1 py-0.5 bg-green-600 text-white rounded hover:bg-green-700`}
                                    >
                                      + Add Button
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Signature Settings */}
                              {(deeperField.field_types || []).includes(FieldType.SIGNATURE) && (
                                <div className={`mb-1 p-1 bg-black text-white rounded text-[${Math.max(6, fontSize - 2)}px]`}>
                                  <label className="block font-medium text-white mb-0.5">Signature Settings</label>
                                  <div className="space-y-0.5">
                                    <label className="flex items-center text-white">
                                      <input
                                        type="checkbox"
                                        className="h-2 w-2 text-blue-600 border-gray-300 rounded mr-0.5"
                                        checked={deeperField.field_options?.require_name || false}
                                        onChange={(e) => {
                                          updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                            const newRules = [...rules];
                                            const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                            deeperFields[deeperFieldIndex] = { 
                                              ...deeperFields[deeperFieldIndex], 
                                              field_options: { ...deeperFields[deeperFieldIndex].field_options, require_name: e.target.checked } 
                                            };
                                            newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                            return newRules;
                                          });
                                        }}
                                      />
                                      Require Name
                                    </label>
                                    <label className="flex items-center text-white">
                                      <input
                                        type="checkbox"
                                        className="h-2 w-2 text-blue-600 border-gray-300 rounded mr-0.5"
                                        checked={deeperField.field_options?.require_date || false}
                                        onChange={(e) => {
                                          updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                            const newRules = [...rules];
                                            const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                            deeperFields[deeperFieldIndex] = { 
                                              ...deeperFields[deeperFieldIndex], 
                                              field_options: { ...deeperFields[deeperFieldIndex].field_options, require_date: e.target.checked } 
                                            };
                                            newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                            return newRules;
                                          });
                                        }}
                                      />
                                      Require Date
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Notes Settings */}
                              {(deeperField.field_types || []).includes(FieldType.NOTES) && (
                                <div className={`mb-1 p-1 bg-white text-black border border-gray-200 rounded text-[${Math.max(6, fontSize - 2)}px]`}>
                                  <label className="block font-medium text-black mb-0.5">Admin Notes (shown to inspectors)</label>
                                  <textarea
                                    className={`w-full text-[${Math.max(6, fontSize - 2)}px] border border-gray-300 rounded px-0.5 py-0.5 text-black bg-white`}
                                    rows={2}
                                    placeholder="Enter instructions that inspectors will read"
                                    value={deeperField.field_options?.notes_text || ''}
                                    onChange={(e) => {
                                      updateNestedConditionalByPath(path[0], [...path.slice(1), deeperRuleIndex], (rules) => {
                                        const newRules = [...rules];
                                        const deeperFields = [...(newRules[deeperRuleIndex].next_fields || [])];
                                        deeperFields[deeperFieldIndex] = {
                                          ...deeperFields[deeperFieldIndex],
                                          field_options: { ...deeperFields[deeperFieldIndex].field_options, notes_text: e.target.value }
                                        };
                                        newRules[deeperRuleIndex] = { ...newRules[deeperRuleIndex], next_fields: deeperFields };
                                        return newRules;
                                      });
                                    }}
                                  />
                                  <p className={`mt-0.5 text-[${Math.max(5, fontSize - 3)}px] italic text-gray-500`}>
                                    Inspectors will see this message and cannot edit it.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Recursive call untuk deeper nesting unlimited */}
                          {renderNestedConditionalFields(
                            deeperField, 
                            [...path, deeperRuleIndex, deeperFieldIndex], 
                            depth + 1
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-[${Math.max(6, fontSize - 2)}px] text-gray-600 italic`}>No fields yet. Click "+ Add Field" above.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
                          <div className="md:col-span-2 space-y-2 bg-white text-gray-900 border border-gray-200 rounded p-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Instructions/Notes</label>
                              <textarea
                                className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-900 bg-white"
                                rows={3}
                                value={field.placeholder_text || field.field_options?.placeholder_text || ''}
                                onChange={(e) => updateField(index, { 
                                  placeholder_text: e.target.value,
                                  field_options: { ...field.field_options, placeholder_text: e.target.value }
                                })}
                                placeholder="Instructions for the inspector..."
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Instruction Photo (optional)</label>
                              <input
                                type="file"
                                accept="image/*"
                                className="mt-1 block w-full text-xs text-gray-900"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) {
                                    updateField(index, { field_options: { ...field.field_options, notes_image: undefined } });
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    updateField(index, { field_options: { ...field.field_options, notes_image: reader.result as string } });
                                  };
                                  reader.readAsDataURL(file);
                                }}
                              />
                              {(field.field_options?.notes_image) && (
                                <div className="mt-2 space-y-1">
                                  <img src={field.field_options.notes_image} alt="Instruction" className="h-24 w-auto rounded border border-gray-300" />
                                  <button
                                    type="button"
                                    onClick={() => updateField(index, { field_options: { ...field.field_options, notes_image: undefined } })}
                                    className="text-xs px-2 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50"
                                  >
                                    Remove Photo
                                  </button>
                                </div>
                              )}
                            </div>
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
                                            subFields[subIndex] = { ...subFields[subIndex], measurement_type: e.target.value as MeasurementType };
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

                        {/* Flag Conditions Section - For Button, Dropdown, and Measurement fields */}
                        {(field.field_type === FieldType.BUTTON || field.field_type === FieldType.DROPDOWN || field.field_type === FieldType.SEARCH_DROPDOWN || field.field_type === FieldType.MEASUREMENT || 
                          field.field_types?.includes(FieldType.BUTTON) || field.field_types?.includes(FieldType.DROPDOWN) || field.field_types?.includes(FieldType.SEARCH_DROPDOWN) || field.field_types?.includes(FieldType.MEASUREMENT)) && (
                        <div className="md:col-span-2 mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-medium text-gray-900">
                              🚩 Flag Conditions (Mark as abnormal when...)
                            </label>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            💡 Set conditions to automatically flag abnormal data for admin review
                          </p>
                          
                          <div className="space-y-3">
                            {/* Button Field Flag Conditions */}
                            {(field.field_type === FieldType.BUTTON || field.field_types?.includes(FieldType.BUTTON)) && (
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <label className="block text-xs font-medium text-gray-900 mb-2">Flag when button value equals:</label>
                                <div className="space-y-2">
                                  {(field.field_options?.button_options || []).map((btn: any, btnIndex: number) => (
                                    <label key={btnIndex} className="flex items-center space-x-2 text-xs">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 text-red-600 border-gray-300 rounded"
                                        checked={(field.flag_conditions?.button_values || []).includes(btn.label)}
                                        onChange={(e) => {
                                          const currentValues = field.flag_conditions?.button_values || [];
                                          const newValues = e.target.checked
                                            ? [...currentValues, btn.label]
                                            : currentValues.filter((v: string) => v !== btn.label);
                                          updateField(index, {
                                            flag_conditions: {
                                              ...field.flag_conditions,
                                              button_values: newValues
                                            }
                                          });
                                        }}
                                      />
                                      <span className={`px-2 py-1 rounded text-white text-xs bg-${btn.color}-500`}>
                                        {btn.label}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Dropdown Field Flag Conditions */}
                            {(field.field_type === FieldType.DROPDOWN || field.field_type === FieldType.SEARCH_DROPDOWN || 
                              field.field_types?.includes(FieldType.DROPDOWN) || field.field_types?.includes(FieldType.SEARCH_DROPDOWN)) && (
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <label className="block text-xs font-medium text-gray-900 mb-2">Flag when dropdown value equals:</label>
                                <div className="space-y-2">
                                  {(field.field_options?.options || []).map((option: string, optIndex: number) => (
                                    <label key={optIndex} className="flex items-center space-x-2 text-xs">
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 text-red-600 border-gray-300 rounded"
                                        checked={(field.flag_conditions?.dropdown_values || []).includes(option)}
                                        onChange={(e) => {
                                          const currentValues = field.flag_conditions?.dropdown_values || [];
                                          const newValues = e.target.checked
                                            ? [...currentValues, option]
                                            : currentValues.filter((v: string) => v !== option);
                                          updateField(index, {
                                            flag_conditions: {
                                              ...field.flag_conditions,
                                              dropdown_values: newValues
                                            }
                                          });
                                        }}
                                      />
                                      <span>{option}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Measurement Field Flag Conditions */}
                            {(field.field_type === FieldType.MEASUREMENT || field.field_types?.includes(FieldType.MEASUREMENT)) && (
                              <div className="bg-red-50 p-3 rounded border border-red-200">
                                <label className="block text-xs font-medium text-gray-900 mb-2">Flag when measurement is out of range:</label>
                                
                                {/* Option to use measurement settings */}
                                <div className="mb-3">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300"
                                      checked={field.flag_conditions?.use_measurement_settings || false}
                                      onChange={(e) => {
                                        const useSettings = e.target.checked;
                                        updateField(index, {
                                          flag_conditions: {
                                            ...field.flag_conditions,
                                            use_measurement_settings: useSettings,
                                            min_value: useSettings ? field.measurement_min : field.flag_conditions?.min_value,
                                            max_value: useSettings ? field.measurement_max : field.flag_conditions?.max_value
                                          }
                                        });
                                      }}
                                    />
                                    <span className="text-xs text-gray-700">
                                      Use measurement settings from above (Min: {field.measurement_min || 'Not set'}, Max: {field.measurement_max || 'Not set'})
                                    </span>
                                  </label>
                                </div>

                                {/* Custom range inputs */}
                                {!field.flag_conditions?.use_measurement_settings && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Minimum Value</label>
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        placeholder="e.g., 0"
                                        value={field.flag_conditions?.min_value || ''}
                                        onChange={(e) => updateField(index, {
                                          flag_conditions: {
                                            ...field.flag_conditions,
                                            min_value: e.target.value ? parseFloat(e.target.value) : undefined
                                          }
                                        })}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">Maximum Value</label>
                                      <input
                                        type="number"
                                        step="any"
                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        placeholder="e.g., 100"
                                        value={field.flag_conditions?.max_value || ''}
                                        onChange={(e) => updateField(index, {
                                          flag_conditions: {
                                            ...field.flag_conditions,
                                            max_value: e.target.value ? parseFloat(e.target.value) : undefined
                                          }
                                        })}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Show current values when using measurement settings */}
                                {field.flag_conditions?.use_measurement_settings && (
                                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                                    <p className="text-xs text-blue-800">
                                      <strong>Current flag range:</strong> Min: {field.measurement_min || 'Not set'}, Max: {field.measurement_max || 'Not set'}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                      Values will be automatically updated when you change the measurement settings above.
                                    </p>
                                  </div>
                                )}

                                <p className="text-xs text-gray-600 mt-2">
                                  Values outside this range will be flagged as abnormal
                                </p>
                              </div>
                            )}
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
                                const conditionalRules = field.conditional_rules || [];
                                updateField(index, {
                                  has_conditional: true,
                                  conditional_rules: [...conditionalRules, { condition_value: '', next_fields: [] }]
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
                          
                          {field.has_conditional && field.conditional_rules && field.conditional_rules.length > 0 && (
                            <div className="space-y-4">
                              {field.conditional_rules.map((rule: any, ruleIndex: number) => (
                                <div key={ruleIndex} className="bg-gray-50 p-4 rounded border border-gray-300">
                                  {/* Condition Header */}
                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-900 mb-1">When Value Equals</label>
                                      <select
                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                        value={rule.condition_value || ''}
                                        onChange={(e) => {
                                          const rules = [...(field.conditional_rules || [])];
                                          rules[ruleIndex] = { ...rules[ruleIndex], condition_value: e.target.value };
                                          updateField(index, { conditional_rules: rules });
                                        }}
                                      >
                                        <option value="">Select value...</option>
                                        {(field.field_options?.options || []).map((opt: string, optIdx: number) => (
                                          <option key={optIdx} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="flex items-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const rules = (field.conditional_rules || []).filter((_: any, i: number) => i !== ruleIndex);
                                          updateField(index, { 
                                            conditional_rules: rules,
                                            has_conditional: rules.length > 0
                                          });
                                        }}
                                        className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300"
                                      >
                                        🗑️ Delete
                                      </button>
                                    </div>
                                  </div>

                                  {/* Fields List */}
                                  <div className="mt-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <label className="block text-xs font-medium text-blue-900">
                                        📋 Fields to show (when "{rule.condition_value || 'this value'}"):
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const rules = [...(field.conditional_rules || [])];
                                          const nextFields = rules[ruleIndex].next_fields || [];
                                          rules[ruleIndex] = {
                                            ...rules[ruleIndex],
                                            next_fields: [...nextFields, {
                                              field_name: '',
                                              field_type: FieldType.TEXT,
                                              field_types: [],
                                              field_options: {},
                                              is_required: false,
                                              field_order: nextFields.length,
                                              has_conditional: false,
                                              conditional_rules: []
                                            }]
                                          };
                                          updateField(index, { conditional_rules: rules });
                                        }}
                                        className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                      >
                                        + Add Field
                                      </button>
                                    </div>

                                    {rule.next_fields && rule.next_fields.length > 0 ? (
                                      <div className="space-y-3 pl-4 border-l-2 border-blue-300">
                                        {rule.next_fields.map((nextField: any, fieldIndex: number) => (
                                          <div key={fieldIndex} className="bg-white p-3 rounded border border-gray-200">
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                              <div>
                                                <label className="block text-xs font-medium text-gray-900 mb-1">Field Name</label>
                                                <input
                                                  type="text"
                                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                  placeholder="Enter field name"
                                                  value={nextField.field_name || ''}
                                                  onChange={(e) => {
                                                    const rules = [...(field.conditional_rules || [])];
                                                    const fields = [...rules[ruleIndex].next_fields];
                                                    fields[fieldIndex] = { ...fields[fieldIndex], field_name: e.target.value };
                                                    rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                    updateField(index, { conditional_rules: rules });
                                                  }}
                                                />
                                              </div>
                                              <div className="flex items-end">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const rules = [...(field.conditional_rules || [])];
                                                    const fields = rules[ruleIndex].next_fields.filter((_: any, i: number) => i !== fieldIndex);
                                                    rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                    updateField(index, { conditional_rules: rules });
                                                  }}
                                                  className="w-full px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300"
                                                >
                                                  🗑️ Delete
                                                </button>
                                              </div>
                                            </div>

                                            {/* Field Types */}
                                            <div>
                                              <label className="block text-xs font-medium text-gray-900 mb-1">Field Types</label>
                                              <div className="grid grid-cols-4 gap-2 p-2 border border-gray-300 rounded bg-gray-50">
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
                                                  <label key={type.value} className="flex items-center space-x-1 text-xs text-gray-900">
                                                    <input
                                                      type="checkbox"
                                                      className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                                                      checked={(nextField.field_types || []).includes(type.value)}
                                                      onChange={(e) => {
                                                        const rules = [...(field.conditional_rules || [])];
                                                        const fields = [...rules[ruleIndex].next_fields];
                                                        const current = fields[fieldIndex].field_types || [];
                                                        const next = e.target.checked
                                                          ? [...current, type.value]
                                                          : current.filter((t: any) => t !== type.value);
                                                        fields[fieldIndex] = { 
                                                          ...fields[fieldIndex], 
                                                          field_types: next, 
                                                          field_type: next[0] || FieldType.TEXT 
                                                        };
                                                        rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                        updateField(index, { conditional_rules: rules });
                                                      }}
                                                    />
                                                    <span className="text-[10px]">{type.label}</span>
                                                  </label>
                                                ))}
                                              </div>
                                            </div>

                                            {/* Required Checkbox */}
                                            <div className="mt-2">
                                              <label className="flex items-center space-x-2 text-xs text-gray-900">
                                                <input
                                                  type="checkbox"
                                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                  checked={nextField.is_required || false}
                                                  onChange={(e) => {
                                                    const rules = [...(field.conditional_rules || [])];
                                                    const fields = [...rules[ruleIndex].next_fields];
                                                    fields[fieldIndex] = { ...fields[fieldIndex], is_required: e.target.checked };
                                                    rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                    updateField(index, { conditional_rules: rules });
                                                  }}
                                                />
                                                <span>Required field</span>
                                              </label>
                                            </div>

                                            {/* Dropdown Options */}
                                            {((nextField.field_types || []).includes(FieldType.DROPDOWN) || (nextField.field_types || []).includes(FieldType.SEARCH_DROPDOWN)) && (
                                              <div className="mt-2">
                                                <label className="block text-xs font-medium text-gray-900 mb-1">Dropdown Options (comma-separated)</label>
                                                <input
                                                  type="text"
                                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                  placeholder="Option 1, Option 2, Option 3"
                                                  value={nextField.field_options?.dropdown_input || ((nextField.field_options?.options || []) as string[]).join(', ')}
                                                  onChange={(e) => {
                                                    const rules = [...(field.conditional_rules || [])];
                                                    const fields = [...rules[ruleIndex].next_fields];
                                                    const inputValue = e.target.value;
                                                    const options = inputValue.split(',').map(o => o.trim()).filter(Boolean);
                                                    fields[fieldIndex] = { 
                                                      ...fields[fieldIndex], 
                                                      field_options: { 
                                                        ...fields[fieldIndex].field_options, 
                                                        dropdown_input: inputValue,
                                                        options 
                                                      } 
                                                    };
                                                    rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                    updateField(index, { conditional_rules: rules });
                                                  }}
                                                />
                                              </div>
                                            )}

                                            {/* Placeholder Text */}
                                            <div className="mt-2">
                                              <label className="block text-xs font-medium text-gray-900 mb-1">Placeholder/Instructions</label>
                                              <input
                                                type="text"
                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                placeholder="Enter placeholder text or instructions"
                                                value={nextField.placeholder_text || ''}
                                                onChange={(e) => {
                                                  const rules = [...(field.conditional_rules || [])];
                                                  const fields = [...rules[ruleIndex].next_fields];
                                                  fields[fieldIndex] = { ...fields[fieldIndex], placeholder_text: e.target.value };
                                                  rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                  updateField(index, { conditional_rules: rules });
                                                }}
                                              />
                                            </div>

                                            {/* Settings for selected field types */}
                                            {(nextField.field_types || []).length > 0 && (
                                              <div className="mt-3 pt-3 border-t border-gray-200">
                                                <label className="block text-xs font-medium text-blue-900 mb-2">
                                                  ⚙️ Settings for selected field types:
                                                </label>
                                                
                                                {/* Photo Settings */}
                                                {(nextField.field_types || []).includes(FieldType.PHOTO) && (
                                                  <div className="grid grid-cols-2 gap-2 mb-2 p-2 bg-black text-white rounded">
                                                    <div>
                                                      <label className="block text-xs font-medium text-white mb-1">Max File Size (MB)</label>
                                                      <input
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                        value={nextField.field_options?.max_size_mb || 5}
                                                        onChange={(e) => {
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          fields[fieldIndex] = { 
                                                            ...fields[fieldIndex], 
                                                            field_options: { ...fields[fieldIndex].field_options, max_size_mb: parseInt(e.target.value) } 
                                                          };
                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                          updateField(index, { conditional_rules: rules });
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-xs font-medium text-white mb-1">Image Quality</label>
                                                      <select
                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                        value={nextField.field_options?.quality || 'medium'}
                                                        onChange={(e) => {
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          fields[fieldIndex] = { 
                                                            ...fields[fieldIndex], 
                                                            field_options: { ...fields[fieldIndex].field_options, quality: e.target.value } 
                                                          };
                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                          updateField(index, { conditional_rules: rules });
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

                                                {/* Measurement Settings */}
                                                {(nextField.field_types || []).includes(FieldType.MEASUREMENT) && (
                                                  <div className="grid grid-cols-3 gap-2 mb-2 p-2 bg-black text-white rounded">
                                                    <div>
                                                      <label className="block text-xs font-medium text-white mb-1">Measurement Type</label>
                                                      <select
                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                        value={nextField.measurement_type || 'between'}
                                                        onChange={(e) => {
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          fields[fieldIndex] = { ...fields[fieldIndex], measurement_type: e.target.value as MeasurementType };
                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                          updateField(index, { conditional_rules: rules });
                                                        }}
                                                      >
                                                        <option value="between">Between</option>
                                                        <option value="higher">Higher Than</option>
                                                        <option value="lower">Lower Than</option>
                                                      </select>
                                                    </div>
                                                    <div>
                                                      <label className="block text-xs font-medium text-white mb-1">Min Value</label>
                                                      <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                        value={nextField.measurement_min || ''}
                                                        onChange={(e) => {
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          fields[fieldIndex] = { ...fields[fieldIndex], measurement_min: parseFloat(e.target.value) };
                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                          updateField(index, { conditional_rules: rules });
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="block text-xs font-medium text-white mb-1">Max Value</label>
                                                      <input
                                                        type="number"
                                                        step="0.01"
                                                        className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                        value={nextField.measurement_max || ''}
                                                        onChange={(e) => {
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          fields[fieldIndex] = { ...fields[fieldIndex], measurement_max: parseFloat(e.target.value) };
                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                          updateField(index, { conditional_rules: rules });
                                                        }}
                                                      />
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Button Settings */}
                                                {(nextField.field_types || []).includes(FieldType.BUTTON) && (
                                                  <div className="mb-2 p-2 bg-black text-white rounded">
                                                    <label className="block text-xs font-medium text-white mb-1">Button Options</label>
                                                    <div className="space-y-1">
                                                      {(nextField.field_options?.button_options || [{label: 'Pass', color: 'green'}, {label: 'Hold', color: 'yellow'}]).map((btn: any, btnIdx: number) => (
                                                        <div key={btnIdx} className="flex items-center space-x-1">
                                                          <input
                                                            type="text"
                                                            className="flex-1 text-xs border border-gray-300 rounded px-1 py-0.5 text-gray-900"
                                                            placeholder="Label"
                                                            value={btn.label}
                                                            onChange={(e) => {
                                                              const rules = [...(field.conditional_rules || [])];
                                                              const fields = [...rules[ruleIndex].next_fields];
                                                              const options = [...(fields[fieldIndex].field_options?.button_options || [])];
                                                              options[btnIdx] = { ...options[btnIdx], label: e.target.value };
                                                              fields[fieldIndex] = { 
                                                                ...fields[fieldIndex], 
                                                                field_options: { ...fields[fieldIndex].field_options, button_options: options } 
                                                              };
                                                              rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                              updateField(index, { conditional_rules: rules });
                                                            }}
                                                          />
                                                          <select
                                                            className="text-xs border border-gray-300 rounded px-1 py-0.5 text-gray-900"
                                                            value={btn.color}
                                                            onChange={(e) => {
                                                              const rules = [...(field.conditional_rules || [])];
                                                              const fields = [...rules[ruleIndex].next_fields];
                                                              const options = [...(fields[fieldIndex].field_options?.button_options || [])];
                                                              options[btnIdx] = { ...options[btnIdx], color: e.target.value };
                                                              fields[fieldIndex] = { 
                                                                ...fields[fieldIndex], 
                                                                field_options: { ...fields[fieldIndex].field_options, button_options: options } 
                                                              };
                                                              rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                              updateField(index, { conditional_rules: rules });
                                                            }}
                                                          >
                                                            <option value="green">Green</option>
                                                            <option value="yellow">Yellow</option>
                                                            <option value="red">Red</option>
                                                            <option value="blue">Blue</option>
                                                            <option value="gray">Gray</option>
                                                          </select>
                                                        </div>
                                                      ))}
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          const options = [...(fields[fieldIndex].field_options?.button_options || []), {label: '', color: 'gray'}];
                                                          fields[fieldIndex] = { 
                                                            ...fields[fieldIndex], 
                                                            field_options: { ...fields[fieldIndex].field_options, button_options: options } 
                                                          };
                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                          updateField(index, { conditional_rules: rules });
                                                        }}
                                                        className="text-xs px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                                                      >
                                                        + Add Button
                                                      </button>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Signature Settings */}
                                                {(nextField.field_types || []).includes(FieldType.SIGNATURE) && (
                                                  <div className="mb-2 p-2 bg-black text-white rounded">
                                                    <label className="block text-xs font-medium text-white mb-1">Signature Settings</label>
                                                    <div className="space-y-1">
                                                      <label className="flex items-center text-xs text-white">
                                                        <input
                                                          type="checkbox"
                                                          className="h-3 w-3 text-blue-600 border-gray-300 rounded mr-1"
                                                          checked={nextField.field_options?.require_name || false}
                                                          onChange={(e) => {
                                                            const rules = [...(field.conditional_rules || [])];
                                                            const fields = [...rules[ruleIndex].next_fields];
                                                            fields[fieldIndex] = { 
                                                              ...fields[fieldIndex], 
                                                              field_options: { ...fields[fieldIndex].field_options, require_name: e.target.checked } 
                                                            };
                                                            rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                            updateField(index, { conditional_rules: rules });
                                                          }}
                                                        />
                                                        Require Name
                                                      </label>
                                                      <label className="flex items-center text-xs text-white">
                                                        <input
                                                          type="checkbox"
                                                          className="h-3 w-3 text-blue-600 border-gray-300 rounded mr-1"
                                                          checked={nextField.field_options?.require_date || false}
                                                          onChange={(e) => {
                                                            const rules = [...(field.conditional_rules || [])];
                                                            const fields = [...rules[ruleIndex].next_fields];
                                                            fields[fieldIndex] = { 
                                                              ...fields[fieldIndex], 
                                                              field_options: { ...fields[fieldIndex].field_options, require_date: e.target.checked } 
                                                            };
                                                            rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                            updateField(index, { conditional_rules: rules });
                                                          }}
                                                        />
                                                        Require Date
                                                      </label>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* Date Settings */}
                                                {(nextField.field_types || []).includes(FieldType.DATE) && (
                                                  <div className="mb-2 p-2 bg-black text-white rounded">
                                                    <label className="block text-xs font-medium text-white mb-1">Date Settings</label>
                                                    <div className="space-y-1">
                                                      <div>
                                                        <label className="block text-xs text-white mb-0.5">Min Date</label>
                                                        <input
                                                          type="date"
                                                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                          value={nextField.field_options?.min_date || ''}
                                                          onChange={(e) => {
                                                            const rules = [...(field.conditional_rules || [])];
                                                            const fields = [...rules[ruleIndex].next_fields];
                                                            fields[fieldIndex] = { 
                                                              ...fields[fieldIndex], 
                                                              field_options: { ...fields[fieldIndex].field_options, min_date: e.target.value } 
                                                            };
                                                            rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                            updateField(index, { conditional_rules: rules });
                                                          }}
                                                        />
                                                      </div>
                                                      <div>
                                                        <label className="block text-xs text-white mb-0.5">Max Date</label>
                                                        <input
                                                          type="date"
                                                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-gray-900"
                                                          value={nextField.field_options?.max_date || ''}
                                                          onChange={(e) => {
                                                            const rules = [...(field.conditional_rules || [])];
                                                            const fields = [...rules[ruleIndex].next_fields];
                                                            fields[fieldIndex] = { 
                                                              ...fields[fieldIndex], 
                                                              field_options: { ...fields[fieldIndex].field_options, max_date: e.target.value } 
                                                            };
                                                            rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                            updateField(index, { conditional_rules: rules });
                                                          }}
                                                        />
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}

                                                {/* DateTime Settings */}
                                                {(nextField.field_types || []).includes(FieldType.DATETIME) && (
                                                  <div className="mb-2 p-2 bg-black text-white rounded">
                                                    <label className="block text-xs font-medium text-white mb-1">Date & Time Settings</label>
                                                    <label className="flex items-center text-xs text-white">
                                                      <input
                                                        type="checkbox"
                                                        className="h-3 w-3 text-blue-600 border-gray-300 rounded mr-1"
                                                        checked={nextField.field_options?.use_current_datetime || false}
                                                        onChange={(e) => {
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          fields[fieldIndex] = { 
                                                            ...fields[fieldIndex], 
                                                            field_options: { ...fields[fieldIndex].field_options, use_current_datetime: e.target.checked } 
                                                          };
                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                          updateField(index, { conditional_rules: rules });
                                                        }}
                                                      />
                                                      Default to current date & time
                                                    </label>
                                                  </div>
                                                )}

                                                {/* Time Settings */}
                                                {(nextField.field_types || []).includes(FieldType.TIME) && (
                                                  <div className="mb-2 p-2 bg-black text-white rounded">
                                                    <label className="block text-xs font-medium text-white mb-1">Time Settings</label>
                                                    <label className="flex items-center text-xs text-white">
                                                      <input
                                                        type="checkbox"
                                                        className="h-3 w-3 text-blue-600 border-gray-300 rounded mr-1"
                                                        checked={nextField.field_options?.use_24hour || true}
                                                        onChange={(e) => {
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          fields[fieldIndex] = { 
                                                            ...fields[fieldIndex], 
                                                            field_options: { ...fields[fieldIndex].field_options, use_24hour: e.target.checked } 
                                                          };
                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                          updateField(index, { conditional_rules: rules });
                                                        }}
                                                      />
                                                      Use 24-hour format
                                                    </label>
                                                  </div>
                                                )}

                                                {/* Notes Settings */}
                                                {(nextField.field_types || []).includes(FieldType.NOTES) && (
                                                  <div className="mb-2 p-2 bg-white text-gray-900 border border-gray-200 rounded">
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Admin Notes (shown to inspectors)</label>
                                                    <textarea
                                                      className="w-full text-xs border border-gray-300 rounded px-1 py-0.5 text-gray-900 bg-white"
                                                      rows={3}
                                                      placeholder="Enter instructions that inspectors will read"
                                                      value={nextField.field_options?.notes_text || ''}
                                                      onChange={(e) => {
                                                        const rules = [...(field.conditional_rules || [])];
                                                        const fields = [...rules[ruleIndex].next_fields];
                                                        fields[fieldIndex] = {
                                                          ...fields[fieldIndex],
                                                          field_options: { ...fields[fieldIndex].field_options, notes_text: e.target.value }
                                                        };
                                                        rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                        updateField(index, { conditional_rules: rules });
                                                      }}
                                                    />
                                                    <p className="mt-1 text-[10px] italic text-gray-500">
                                                      Inspectors will see this message and cannot edit it.
                                                    </p>
                                                    <div className="mt-2">
                                                      <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Instruction Photo (optional)</label>
                                                      <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="w-full text-[10px] text-gray-900"
                                                        onChange={(e) => {
                                                          const file = e.target.files?.[0];
                                                          const rules = [...(field.conditional_rules || [])];
                                                          const fields = [...rules[ruleIndex].next_fields];
                                                          if (!file) {
                                                            fields[fieldIndex] = {
                                                              ...fields[fieldIndex],
                                                              field_options: { ...fields[fieldIndex].field_options, notes_image: undefined }
                                                            };
                                                            rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                            updateField(index, { conditional_rules: rules });
                                                            return;
                                                          }
                                                          const reader = new FileReader();
                                                          reader.onloadend = () => {
                                                            const updatedRules = [...(field.conditional_rules || [])];
                                                            const updatedFields = [...updatedRules[ruleIndex].next_fields];
                                                            updatedFields[fieldIndex] = {
                                                              ...updatedFields[fieldIndex],
                                                              field_options: { ...updatedFields[fieldIndex].field_options, notes_image: reader.result as string }
                                                            };
                                                            updatedRules[ruleIndex] = { ...updatedRules[ruleIndex], next_fields: updatedFields };
                                                            updateField(index, { conditional_rules: updatedRules });
                                                          };
                                                          reader.readAsDataURL(file);
                                                        }}
                                                      />
                                                      {(nextField.field_options?.notes_image) && (
                                                        <div className="mt-1 space-y-1">
                                                          <img src={nextField.field_options.notes_image} alt="Instruction" className="h-20 w-auto rounded border border-gray-300" />
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              const rules = [...(field.conditional_rules || [])];
                                                              const fields = [...rules[ruleIndex].next_fields];
                                                              fields[fieldIndex] = {
                                                                ...fields[fieldIndex],
                                                                field_options: { ...fields[fieldIndex].field_options, notes_image: undefined }
                                                              };
                                                              rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                              updateField(index, { conditional_rules: rules });
                                                            }}
                                                            className="text-[10px] px-2 py-0.5 text-red-500 border border-red-300 rounded hover:bg-red-50"
                                                          >
                                                            Remove Photo
                                                          </button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            {/* Nested Conditional Logic for Dropdown fields */}
                                            {((nextField.field_types || []).includes(FieldType.DROPDOWN) || (nextField.field_types || []).includes(FieldType.SEARCH_DROPDOWN)) && (
                                              <div className="mt-3 pt-3 border-t border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                  <label className="block text-xs font-medium text-purple-900">
                                                    🔀 Nested Conditional Logic
                                                  </label>
                                                  <button
                                                    type="button"
                                                    onClick={() => {
                                                      const rules = [...(field.conditional_rules || [])];
                                                      const fields = [...rules[ruleIndex].next_fields];
                                                      const nestedRules = fields[fieldIndex].conditional_rules || [];
                                                      fields[fieldIndex] = {
                                                        ...fields[fieldIndex],
                                                        has_conditional: true,
                                                        conditional_rules: [...nestedRules, { condition_value: '', next_fields: [] }]
                                                      };
                                                      rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                      updateField(index, { conditional_rules: rules });
                                                    }}
                                                    className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                                  >
                                                    + Add Nested Condition
                                                  </button>
                                                </div>

                                                {nextField.has_conditional && nextField.conditional_rules && nextField.conditional_rules.length > 0 && (
                                                  <div className="space-y-2 pl-3 border-l-2 border-purple-300">
                                                    {nextField.conditional_rules.map((nestedRule: any, nestedRuleIndex: number) => (
                                                      <div key={nestedRuleIndex} className="bg-purple-50 p-2 rounded border border-purple-200 text-xs">
                                                        <div className="flex items-center justify-between mb-2">
                                                          <select
                                                            className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 text-gray-900 mr-2"
                                                            value={nestedRule.condition_value || ''}
                                                            onChange={(e) => {
                                                              const rules = [...(field.conditional_rules || [])];
                                                              const fields = [...rules[ruleIndex].next_fields];
                                                              const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                              nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], condition_value: e.target.value };
                                                              fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                              rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                              updateField(index, { conditional_rules: rules });
                                                            }}
                                                          >
                                                            <option value="">Select value...</option>
                                                            {((nextField.field_options?.options || []) as string[]).map((opt: string, optIdx: number) => (
                                                              <option key={optIdx} value={opt}>{opt}</option>
                                                            ))}
                                                          </select>
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              const rules = [...(field.conditional_rules || [])];
                                                              const fields = [...rules[ruleIndex].next_fields];
                                                              const nestedRules = (fields[fieldIndex].conditional_rules || []).filter((_: any, i: number) => i !== nestedRuleIndex);
                                                              fields[fieldIndex] = { 
                                                                ...fields[fieldIndex], 
                                                                conditional_rules: nestedRules,
                                                                has_conditional: nestedRules.length > 0
                                                              };
                                                              rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                              updateField(index, { conditional_rules: rules });
                                                            }}
                                                            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300"
                                                          >
                                                            🗑️
                                                          </button>
                                                        </div>
                                                        
                                                        {/* Nested Fields List */}
                                                        <div className="mt-2">
                                                          <div className="flex items-center justify-between mb-1">
                                                            <label className="block text-[10px] font-medium text-purple-900">
                                                              📋 Fields for "{nestedRule.condition_value || 'this value'}':
                                                            </label>
                                                            <button
                                                              type="button"
                                                              onClick={() => {
                                                                const rules = [...(field.conditional_rules || [])];
                                                                const fields = [...rules[ruleIndex].next_fields];
                                                                const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                const nestedFields = nestedRules[nestedRuleIndex].next_fields || [];
                                                                nestedRules[nestedRuleIndex] = {
                                                                  ...nestedRules[nestedRuleIndex],
                                                                  next_fields: [...nestedFields, {
                                                                    field_name: '',
                                                                    field_type: FieldType.TEXT,
                                                                    field_types: [],
                                                                    field_options: {},
                                                                    is_required: false,
                                                                    field_order: nestedFields.length,
                                                                    has_conditional: false,
                                                                    conditional_rules: []
                                                                  }]
                                                                };
                                                                fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                updateField(index, { conditional_rules: rules });
                                                              }}
                                                              className="text-[10px] px-2 py-0.5 bg-green-600 text-white rounded hover:bg-green-700"
                                                            >
                                                              + Add Field
                                                            </button>
                                                          </div>
                                                          
                                                          {nestedRule.next_fields && nestedRule.next_fields.length > 0 ? (
                                                            <div className="space-y-2">
                                                              {nestedRule.next_fields.map((nestedField: any, nestedFieldIndex: number) => (
                                                                <div key={nestedFieldIndex} className="bg-white p-2 rounded border border-purple-200 text-[10px]">
                                                                  <div className="grid grid-cols-2 gap-2 mb-1">
                                                                    <div>
                                                                      <label className="block text-[10px] font-medium text-gray-900 mb-0.5">Field Name</label>
                                                                      <input
                                                                        type="text"
                                                                        className="w-full text-[10px] border border-gray-300 rounded px-1 py-0.5 text-gray-900"
                                                                        placeholder="Enter field name"
                                                                        value={nestedField.field_name || ''}
                                                                        onChange={(e) => {
                                                                          const rules = [...(field.conditional_rules || [])];
                                                                          const fields = [...rules[ruleIndex].next_fields];
                                                                          const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                          const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                          nestedFields[nestedFieldIndex] = { ...nestedFields[nestedFieldIndex], field_name: e.target.value };
                                                                          nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                          fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                          updateField(index, { conditional_rules: rules });
                                                                        }}
                                                                      />
                                                                    </div>
                                                                    <div className="flex items-end">
                                                                      <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                          const rules = [...(field.conditional_rules || [])];
                                                                          const fields = [...rules[ruleIndex].next_fields];
                                                                          const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                          const nestedFields = nestedRules[nestedRuleIndex].next_fields.filter((_: any, i: number) => i !== nestedFieldIndex);
                                                                          nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                          fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                          updateField(index, { conditional_rules: rules });
                                                                        }}
                                                                        className="w-full px-1 py-0.5 text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50 rounded border border-red-300"
                                                                      >
                                                                        🗑️ Delete
                                                                      </button>
                                                                    </div>
                                                                  </div>
                                                                  
                                                                  {/* Field Types */}
                                                                  <div className="mb-1">
                                                                    <label className="block text-[10px] font-medium text-gray-900 mb-0.5">Field Types</label>
                                                                    <div className="grid grid-cols-4 gap-1 p-1 border border-gray-300 rounded bg-gray-50">
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
                                                                        <label key={type.value} className="flex items-center space-x-0.5 text-[9px] text-gray-900">
                                                                          <input
                                                                            type="checkbox"
                                                                            className="h-2.5 w-2.5 text-blue-600 border-gray-300 rounded"
                                                                            checked={(nestedField.field_types || []).includes(type.value)}
                                                                            onChange={(e) => {
                                                                              const rules = [...(field.conditional_rules || [])];
                                                                              const fields = [...rules[ruleIndex].next_fields];
                                                                              const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                              const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                              const current = nestedFields[nestedFieldIndex].field_types || [];
                                                                              const next = e.target.checked
                                                                                ? [...current, type.value]
                                                                                : current.filter((t: any) => t !== type.value);
                                                                              nestedFields[nestedFieldIndex] = { 
                                                                                ...nestedFields[nestedFieldIndex], 
                                                                                field_types: next, 
                                                                                field_type: next[0] || FieldType.TEXT 
                                                                              };
                                                                              nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                              fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                              rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                              updateField(index, { conditional_rules: rules });
                                                                            }}
                                                                          />
                                                                          <span>{type.label}</span>
                                                                        </label>
                                                                      ))}
                                                                    </div>
                                                                  </div>
                                                                  
                                                                  {/* Required */}
                                                                  <div className="mb-1">
                                                                    <label className="flex items-center space-x-1 text-[10px] text-gray-900">
                                                                      <input
                                                                        type="checkbox"
                                                                        className="h-3 w-3 text-blue-600 border-gray-300 rounded"
                                                                        checked={nestedField.is_required || false}
                                                                        onChange={(e) => {
                                                                          const rules = [...(field.conditional_rules || [])];
                                                                          const fields = [...rules[ruleIndex].next_fields];
                                                                          const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                          const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                          nestedFields[nestedFieldIndex] = { ...nestedFields[nestedFieldIndex], is_required: e.target.checked };
                                                                          nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                          fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                          updateField(index, { conditional_rules: rules });
                                                                        }}
                                                                      />
                                                                      <span>Required</span>
                                                                    </label>
                                                                  </div>
                                                                  
                                                                  {/* Dropdown Options */}
                                                                  {((nestedField.field_types || []).includes(FieldType.DROPDOWN)) && (
                                                                    <div className="mb-1">
                                                                      <label className="block text-[10px] font-medium text-gray-900 mb-0.5">Options</label>
                                                                      <input
                                                                        type="text"
                                                                        className="w-full text-[10px] border border-gray-300 rounded px-1 py-0.5 text-gray-900"
                                                                        placeholder="Option 1, Option 2"
                                                                        value={nestedField.field_options?.dropdown_input || ((nestedField.field_options?.options || []) as string[]).join(', ')}
                                                                        onChange={(e) => {
                                                                          const rules = [...(field.conditional_rules || [])];
                                                                          const fields = [...rules[ruleIndex].next_fields];
                                                                          const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                          const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                          const inputValue = e.target.value;
                                                                          const options = inputValue.split(',').map(o => o.trim()).filter(Boolean);
                                                                          nestedFields[nestedFieldIndex] = { 
                                                                            ...nestedFields[nestedFieldIndex], 
                                                                            field_options: { 
                                                                              ...nestedFields[nestedFieldIndex].field_options, 
                                                                              dropdown_input: inputValue,
                                                                              options 
                                                                            } 
                                                                          };
                                                                          nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                          fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                          rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                          updateField(index, { conditional_rules: rules });
                                                                        }}
                                                                      />
                                                                    </div>
                                                                  )}

                                                                  {/* Adjustment Settings for Nested Fields */}
                                                                  {(nestedField.field_types || []).length > 0 && (
                                                                    <div className="mt-2 pt-2 border-t border-purple-200">
                                                                      <label className="block text-[10px] font-medium text-purple-900 mb-1">
                                                                        ⚙️ Settings:
                                                                      </label>
                                                                      
                                                                      {/* Photo Settings */}
                                                                      {(nestedField.field_types || []).includes(FieldType.PHOTO) && (
                                                                        <div className="grid grid-cols-2 gap-1 mb-1 p-1 bg-blue-50 rounded text-[9px]">
                                                                          <div>
                                                                            <label className="block font-medium text-gray-900">Max Size (MB)</label>
                                                                            <input type="number" min="1" max="50" className="w-full border border-gray-300 rounded px-1 py-0.5" value={nestedField.field_options?.max_size_mb || 5} />
                                                                          </div>
                                                                          <div>
                                                                            <label className="block font-medium text-gray-900">Quality</label>
                                                                            <select className="w-full border border-gray-300 rounded px-1 py-0.5">
                                                                              <option value="medium">Medium</option>
                                                                              <option value="high">High</option>
                                                                            </select>
                                                                          </div>
                                                                        </div>
                                                                      )}

                                                                      {/* Measurement Settings */}
                                                                      {(nestedField.field_types || []).includes(FieldType.MEASUREMENT) && (
                                                                        <div className="grid grid-cols-3 gap-1 mb-1 p-1 bg-blue-50 rounded text-[9px]">
                                                                          <div>
                                                                            <label className="block font-medium">Type</label>
                                                                            <select className="w-full border rounded px-1 py-0.5">
                                                                              <option>Between</option>
                                                                            </select>
                                                                          </div>
                                                                          <div>
                                                                            <label className="block font-medium">Min</label>
                                                                            <input type="number" className="w-full border rounded px-1 py-0.5" />
                                                                          </div>
                                                                          <div>
                                                                            <label className="block font-medium">Max</label>
                                                                            <input type="number" className="w-full border rounded px-1 py-0.5" />
                                                                          </div>
                                                                        </div>
                                                                      )}

                                                                      {/* Button Settings */}
                                                                      {(nestedField.field_types || []).includes(FieldType.BUTTON) && (
                                                                        <div className="mb-1 p-1 bg-green-50 rounded text-[9px]">
                                                                          <label className="block font-medium mb-0.5">Button Options</label>
                                                                          {(nestedField.field_options?.button_options || [{label: 'Pass', color: 'green'}]).map((btn: any, btnIdx: number) => (
                                                                            <div key={btnIdx} className="flex items-center space-x-0.5 mb-0.5">
                                                                              <input
                                                                                type="text"
                                                                                className="flex-1 border rounded px-0.5 py-0.5 text-[9px]"
                                                                                placeholder="Label"
                                                                                value={btn.label}
                                                                                onChange={(e) => {
                                                                                  const rules = [...(field.conditional_rules || [])];
                                                                                  const fields = [...rules[ruleIndex].next_fields];
                                                                                  const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                                  const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                                  const options = [...(nestedFields[nestedFieldIndex].field_options?.button_options || [])];
                                                                                  options[btnIdx] = { ...options[btnIdx], label: e.target.value };
                                                                                  nestedFields[nestedFieldIndex] = { 
                                                                                    ...nestedFields[nestedFieldIndex], 
                                                                                    field_options: { ...nestedFields[nestedFieldIndex].field_options, button_options: options } 
                                                                                  };
                                                                                  nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                                  fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                                  rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                                  updateField(index, { conditional_rules: rules });
                                                                                }}
                                                                              />
                                                                              <select
                                                                                className="border rounded px-0.5 py-0.5 text-[9px]"
                                                                                value={btn.color}
                                                                                onChange={(e) => {
                                                                                  const rules = [...(field.conditional_rules || [])];
                                                                                  const fields = [...rules[ruleIndex].next_fields];
                                                                                  const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                                  const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                                  const options = [...(nestedFields[nestedFieldIndex].field_options?.button_options || [])];
                                                                                  options[btnIdx] = { ...options[btnIdx], color: e.target.value };
                                                                                  nestedFields[nestedFieldIndex] = { 
                                                                                    ...nestedFields[nestedFieldIndex], 
                                                                                    field_options: { ...nestedFields[nestedFieldIndex].field_options, button_options: options } 
                                                                                  };
                                                                                  nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                                  fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                                  rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                                  updateField(index, { conditional_rules: rules });
                                                                                }}
                                                                              >
                                                                                <option value="green">Green</option>
                                                                                <option value="yellow">Yellow</option>
                                                                                <option value="red">Red</option>
                                                                                <option value="blue">Blue</option>
                                                                              </select>
                                                                            </div>
                                                                          ))}
                                                                        </div>
                                                                      )}

                                                                      {/* Signature Settings */}
                                                                      {(nestedField.field_types || []).includes(FieldType.SIGNATURE) && (
                                                                        <div className="mb-1 p-1 bg-purple-50 rounded text-[9px]">
                                                                          <label className="block font-medium mb-0.5">Signature Settings</label>
                                                                          <label className="flex items-center mb-0.5">
                                                                            <input type="checkbox" className="h-2 w-2 mr-0.5" checked={nestedField.field_options?.require_name || false} />
                                                                            Require Name
                                                                          </label>
                                                                          <label className="flex items-center">
                                                                            <input type="checkbox" className="h-2 w-2 mr-0.5" checked={nestedField.field_options?.require_date || false} />
                                                                            Require Date
                                                                          </label>
                                                                        </div>
                                                                      )}

                                                                      {/* Date Settings */}
                                                                      {(nestedField.field_types || []).includes(FieldType.DATE) && (
                                                                        <div className="mb-1 p-1 bg-yellow-50 rounded text-[9px]">
                                                                          <label className="block font-medium mb-0.5">Date Settings</label>
                                                                          <div className="mb-0.5">
                                                                            <label className="block text-[8px]">Min Date</label>
                                                                            <input type="date" className="w-full border rounded px-0.5 py-0.5 text-[9px]" value={nestedField.field_options?.min_date || ''} />
                                                                          </div>
                                                                          <div>
                                                                            <label className="block text-[8px]">Max Date</label>
                                                                            <input type="date" className="w-full border rounded px-0.5 py-0.5 text-[9px]" value={nestedField.field_options?.max_date || ''} />
                                                                          </div>
                                                                        </div>
                                                                      )}

                                                                      {/* DateTime Settings */}
                                                                      {(nestedField.field_types || []).includes(FieldType.DATETIME) && (
                                                                        <div className="mb-1 p-1 bg-orange-50 rounded text-[9px]">
                                                                          <label className="block font-medium mb-0.5">Date & Time Settings</label>
                                                                          <label className="flex items-center">
                                                                            <input type="checkbox" className="h-2 w-2 mr-0.5" checked={nestedField.field_options?.use_current_datetime || false} />
                                                                            Default to current
                                                                          </label>
                                                                        </div>
                                                                      )}

                                                                      {/* Time Settings */}
                                                                      {(nestedField.field_types || []).includes(FieldType.TIME) && (
                                                                        <div className="mb-1 p-1 bg-pink-50 rounded text-[9px]">
                                                                          <label className="block font-medium mb-0.5">Time Settings</label>
                                                                          <label className="flex items-center">
                                                                            <input type="checkbox" className="h-2 w-2 mr-0.5" checked={nestedField.field_options?.use_24hour || true} />
                                                                            Use 24-hour format
                                                                          </label>
                                                                        </div>
                                                                      )}

                                                                      {/* Notes Settings */}
                                                                      {(nestedField.field_types || []).includes(FieldType.NOTES) && (
                                                                        <div className="mb-1 p-1 bg-white text-gray-900 border border-gray-200 rounded text-[9px]">
                                                                          <label className="block font-medium text-gray-700 mb-0.5">Admin Notes (shown to inspectors)</label>
                                                                          <textarea
                                                                            className="w-full border rounded px-0.5 py-0.5 text-[9px] text-gray-900 bg-white"
                                                                            rows={2}
                                                                            placeholder="Enter instructions for inspectors"
                                                                            value={nestedField.field_options?.notes_text || ''}
                                                                            onChange={(e) => {
                                                                              const rules = [...(field.conditional_rules || [])];
                                                                              const fields = [...rules[ruleIndex].next_fields];
                                                                              const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                              const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                              nestedFields[nestedFieldIndex] = {
                                                                                ...nestedFields[nestedFieldIndex],
                                                                                field_options: { ...nestedFields[nestedFieldIndex].field_options, notes_text: e.target.value }
                                                                              };
                                                                              nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                              fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                              rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                              updateField(index, { conditional_rules: rules });
                                                                            }}
                                                                          />
                                                                          <p className="mt-0.5 text-[7px] italic text-gray-500">
                                                                            Inspectors read this note and cannot edit it.
                                                                          </p>
                                                                          <div className="mt-1">
                                                                            <label className="block text-[8px] font-medium text-gray-700 mb-0.5">Instruction Photo (optional)</label>
                                                                            <input
                                                                              type="file"
                                                                              accept="image/*"
                                                                              className="w-full text-[8px] text-gray-900"
                                                                              onChange={(e) => {
                                                                                const file = e.target.files?.[0];
                                                                                const rules = [...(field.conditional_rules || [])];
                                                                                const fields = [...rules[ruleIndex].next_fields];
                                                                                const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                                const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                                if (!file) {
                                                                                  nestedFields[nestedFieldIndex] = {
                                                                                    ...nestedFields[nestedFieldIndex],
                                                                                    field_options: { ...nestedFields[nestedFieldIndex].field_options, notes_image: undefined }
                                                                                  };
                                                                                  nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                                  fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                                  rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                                  updateField(index, { conditional_rules: rules });
                                                                                  return;
                                                                                }
                                                                                const reader = new FileReader();
                                                                                reader.onloadend = () => {
                                                                                  const updatedRules = [...(field.conditional_rules || [])];
                                                                                  const updatedFields = [...updatedRules[ruleIndex].next_fields];
                                                                                  const updatedNestedRules = [...(updatedFields[fieldIndex].conditional_rules || [])];
                                                                                  const updatedNestedFields = [...updatedNestedRules[nestedRuleIndex].next_fields];
                                                                                  updatedNestedFields[nestedFieldIndex] = {
                                                                                    ...updatedNestedFields[nestedFieldIndex],
                                                                                    field_options: { ...updatedNestedFields[nestedFieldIndex].field_options, notes_image: reader.result as string }
                                                                                  };
                                                                                  updatedNestedRules[nestedRuleIndex] = { ...updatedNestedRules[nestedRuleIndex], next_fields: updatedNestedFields };
                                                                                  updatedFields[fieldIndex] = { ...updatedFields[fieldIndex], conditional_rules: updatedNestedRules };
                                                                                  updatedRules[ruleIndex] = { ...updatedRules[ruleIndex], next_fields: updatedFields };
                                                                                  updateField(index, { conditional_rules: updatedRules });
                                                                                };
                                                                                reader.readAsDataURL(file);
                                                                              }}
                                                                            />
                                                                            {(nestedField.field_options?.notes_image) && (
                                                                              <div className="mt-1 space-y-1">
                                                                                <img src={nestedField.field_options.notes_image} alt="Instruction" className="h-16 w-auto rounded border border-gray-300" />
                                                                                <button
                                                                                  type="button"
                                                                                  onClick={() => {
                                                                                    const rules = [...(field.conditional_rules || [])];
                                                                                    const fields = [...rules[ruleIndex].next_fields];
                                                                                    const nestedRules = [...(fields[fieldIndex].conditional_rules || [])];
                                                                                    const nestedFields = [...nestedRules[nestedRuleIndex].next_fields];
                                                                                    nestedFields[nestedFieldIndex] = {
                                                                                      ...nestedFields[nestedFieldIndex],
                                                                                      field_options: { ...nestedFields[nestedFieldIndex].field_options, notes_image: undefined }
                                                                                    };
                                                                                    nestedRules[nestedRuleIndex] = { ...nestedRules[nestedRuleIndex], next_fields: nestedFields };
                                                                                    fields[fieldIndex] = { ...fields[fieldIndex], conditional_rules: nestedRules };
                                                                                    rules[ruleIndex] = { ...rules[ruleIndex], next_fields: fields };
                                                                                    updateField(index, { conditional_rules: rules });
                                                                                  }}
                                                                                  className="text-[8px] px-1 py-0.5 text-red-500 border border-red-300 rounded hover:bg-red-50"
                                                                                >
                                                                                  Remove Photo
                                                                                </button>
                                                                              </div>
                                                                            )}
                                                                          </div>
                                                                        </div>
                                                                      )}
                                                                      
                                                                      {/* Unlimited Deeper Nesting - RECURSIVE */}
                                                                      {renderNestedConditionalFields(
                                                                        nestedField, 
                                                                        [index, ruleIndex, fieldIndex, nestedRuleIndex, nestedFieldIndex], 
                                                                        0
                                                                      )}
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              ))}
                                                            </div>
                                                          ) : (
                                                            <p className="text-[9px] text-purple-600 italic">No fields yet. Click "+ Add Field" above.</p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                                        
                                        {/* Add Field Button at Bottom */}
                                        <div className="pl-4 pt-2">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const rules = [...(field.conditional_rules || [])];
                                              const nextFields = rules[ruleIndex].next_fields || [];
                                              rules[ruleIndex] = {
                                                ...rules[ruleIndex],
                                                next_fields: [...nextFields, {
                                                  field_name: '',
                                                  field_type: FieldType.TEXT,
                                                  field_types: [],
                                                  field_options: {},
                                                  is_required: false,
                                                  field_order: nextFields.length,
                                                  has_conditional: false,
                                                  conditional_rules: []
                                                }]
                                              };
                                              updateField(index, { conditional_rules: rules });
                                            }}
                                            className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                          >
                                            + Add Field
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 italic pl-4">
                                        No fields added yet. Click "+ Add Field" to add fields that will show when this condition is met.
                                      </p>
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-700 mt-3 italic">
                                    💡 This field will only show when conditions are met
                                  </p>
                                </div>
                              ))}
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
