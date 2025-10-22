export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  SUPERVISOR = 'supervisor',
  MANAGEMENT = 'management'
}

export enum InspectionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}

export enum FieldType {
  TEXT = 'text',
  DROPDOWN = 'dropdown',
  SEARCH_DROPDOWN = 'search_dropdown',
  BUTTON = 'button',
  PHOTO = 'photo',
  SIGNATURE = 'signature',
  MEASUREMENT = 'measurement',
  NOTES = 'notes',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  SUBFORM = 'subform'
}

export enum MeasurementType {
  BETWEEN = 'between',
  HIGHER = 'higher',
  LOWER = 'lower'
}

export enum PassHoldStatus {
  PASS = 'pass',
  HOLD = 'hold'
}

export interface User {
  id: number;
  user_id: string;
  username: string;
  email: string;
  role: UserRole;
  plant?: string;
  line_process?: string;
  created_at: string;
  is_active: boolean;
}

export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ConditionalRule {
  condition_value: string;
  next_fields: FormField[];
}

export interface FormField {
  id?: number;
  form_id?: number;
  field_name: string;
  field_type: FieldType;
  field_types?: FieldType[];
  field_options?: Record<string, any>;
  measurement_type?: MeasurementType;
  measurement_min?: number;
  measurement_max?: number;
  is_required: boolean;
  field_order: number;
  created_at?: string;
  has_conditional?: boolean;
  conditional_rules?: ConditionalRule[];
  placeholder_text?: string;
  flag_conditions?: {
    dropdown_value?: string;
    dropdown_values?: string[];
    button_values?: string[];
    min_value?: number;
    max_value?: number;
    use_measurement_settings?: boolean;
  };
}

export interface Form {
  id: number;
  form_name: string;
  description?: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  fields: FormField[];
}

export interface InspectionResponse {
  id?: number;
  inspection_id?: number;
  field_id: number | null;  // Allow null for conditional fields without database ID
  response_value?: string;
  measurement_value?: number;
  pass_hold_status?: PassHoldStatus;
  is_flagged?: boolean;  // Flag for abnormal data detection
  created_at?: string;
  conditional_field_name?: string;  // For conditional fields
  conditional_parent_field_id?: number;  // Parent field ID for conditional fields
}

export interface Inspection {
  id: number;
  form_id: number;
  inspector_id: number;
  status: InspectionStatus;
  reviewed_by?: number;
  reviewed_at?: string;
  rejection_reason?: string;
  reviewer_signature?: string;
  created_at: string;
  updated_at: string;
  responses: InspectionResponse[];
  has_flags?: boolean;  // Indicates if inspection has any flagged responses
  form_name?: string;  // Form name for display
  inspector_username?: string;  // Inspector username for display
}

export interface DashboardStats {
  total_inspections: number;
  submitted_inspections: number;
  accepted_inspections: number;
  rejected_inspections: number;
  draft_inspections: number;
  total_forms: number;
}

export interface AnalyticsData {
  date: string;
  count: number;
}

export interface AnalyticsResponse {
  daily_inspections: AnalyticsData[];
  monthly_inspections: AnalyticsData[];
  inspection_by_status: Array<{ status: string; count: number }>;
  inspection_by_plant: Array<{ plant: string; count: number }>;
}
