import axios from 'axios';
import type {
  ConfigurationListItem,
  ConfigurationDetail,
  ConfigurationFilters,
  ConfigFormData,
  Template,
  TemplateFormData,
} from '../types';

// In production VITE_API_URL points to the Railway backend (e.g. https://myapp.up.railway.app/api).
// In local dev the Vite proxy forwards /api to localhost:3001.
const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const api = axios.create({ baseURL: BASE_URL });

// --- Configurations ---

export async function getConfigurations(
  filters: ConfigurationFilters = {}
): Promise<ConfigurationListItem[]> {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== '')
  );
  const { data } = await api.get('/configurations', { params });
  return data;
}

export async function getConfiguration(id: string): Promise<ConfigurationDetail> {
  const { data } = await api.get(`/configurations/${id}`);
  return data;
}

export async function createConfiguration(
  payload: Partial<ConfigFormData>
): Promise<ConfigurationDetail> {
  const { data } = await api.post('/configurations', payload);
  return data;
}

export async function updateConfiguration(
  id: string,
  payload: Partial<ConfigFormData>
): Promise<ConfigurationDetail> {
  const { data } = await api.put(`/configurations/${id}`, payload);
  return data;
}

export async function deleteConfiguration(id: string): Promise<void> {
  await api.delete(`/configurations/${id}`);
}

export async function duplicateConfiguration(
  id: string
): Promise<ConfigurationDetail> {
  const { data } = await api.post(`/configurations/${id}/duplicate`);
  return data;
}

// --- Templates ---

export async function getTemplates(): Promise<Template[]> {
  const { data } = await api.get('/templates');
  return data;
}

export async function getTemplate(id: string): Promise<Template> {
  const { data } = await api.get(`/templates/${id}`);
  return data;
}

export async function createTemplate(
  payload: Partial<TemplateFormData>
): Promise<Template> {
  const { data } = await api.post('/templates', payload);
  return data;
}

export async function updateTemplate(
  id: string,
  payload: Partial<TemplateFormData>
): Promise<Template> {
  const { data } = await api.put(`/templates/${id}`, payload);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}
