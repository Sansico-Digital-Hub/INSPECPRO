import axios from 'axios';
import type { 
  User, 
  LoginRequest, 
  AuthResponse, 
  Form, 
  FormField,
  Inspection, 
  InspectionResponse,
  DashboardStats,
  AnalyticsResponse,
  InspectionStatus
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/api/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
};

// Users APIs
export const usersAPI = {
  getUsers: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/api/users/');
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/api/users/${id}`);
    return response.data;
  },

  createUser: async (userData: Partial<User> & { password: string }): Promise<User> => {
    const response = await api.post<User>('/api/users/', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: Partial<User>): Promise<User> => {
    const response = await api.put<User>(`/api/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/api/users/${id}`);
  },
};

// Forms APIs
export const formsAPI = {
  getForms: async (): Promise<Form[]> => {
    const response = await api.get<Form[]>('/api/forms/');
    return response.data;
  },

  getForm: async (id: number): Promise<Form> => {
    const response = await api.get<Form>(`/api/forms/${id}`);
    return response.data;
  },

  createForm: async (formData: { form_name: string; description?: string; fields: FormField[] }): Promise<Form> => {
    const response = await api.post<Form>('/api/forms/', formData);
    return response.data;
  },

  updateForm: async (id: number, formData: { form_name: string; description?: string; fields: FormField[] }): Promise<Form> => {
    const response = await api.put<Form>(`/api/forms/${id}/complete`, formData);
    return response.data;
  },

  deleteForm: async (id: number): Promise<void> => {
    await api.delete(`/api/forms/${id}`);
  },
};

// Inspections APIs
export const inspectionsAPI = {
  getInspections: async (params?: { status_filter?: InspectionStatus }): Promise<Inspection[]> => {
    const response = await api.get<Inspection[]>('/api/inspections/', { params });
    return response.data;
  },

  getInspection: async (id: number): Promise<Inspection> => {
    const response = await api.get<Inspection>(`/api/inspections/${id}`);
    return response.data;
  },

  createInspection: async (inspectionData: { form_id: number; responses: InspectionResponse[] }): Promise<Inspection> => {
    const response = await api.post<Inspection>('/api/inspections/', inspectionData);
    return response.data;
  },

  updateInspection: async (id: number, inspectionData: Partial<Inspection>): Promise<Inspection> => {
    const response = await api.put<Inspection>(`/api/inspections/${id}`, inspectionData);
    return response.data;
  },

  submitInspection: async (id: number): Promise<Inspection> => {
    const response = await api.post<Inspection>(`/api/inspections/${id}/submit`);
    return response.data;
  },

  deleteInspection: async (id: number): Promise<void> => {
    await api.delete(`/api/inspections/${id}`);
  },

  exportToPDF: async (id: number): Promise<void> => {
    const response = await api.get(`/api/inspections/${id}/export/pdf`, {
      responseType: 'blob',
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inspection_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
  },
};

// Analytics APIs
export const analyticsAPI = {
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const response = await api.get<AnalyticsResponse>('/api/analytics/');
    return response.data;
  },
};

export default api;
