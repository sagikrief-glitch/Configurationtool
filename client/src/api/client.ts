import { supabase } from '../lib/supabase';
import type {
  ConfigurationListItem,
  ConfigurationDetail,
  ConfigurationFilters,
  ConfigFormData,
  Template,
  TemplateFormData,
  TemplateField,
  ResolvedField,
} from '../types';

// --- Configurations ---

export async function getConfigurations(
  filters: ConfigurationFilters = {}
): Promise<ConfigurationListItem[]> {
  let query = supabase
    .from('Configuration')
    .select('id,name,description,category,type,market,provider,environment,tags,templateId,createdAt,updatedAt')
    .order('updatedAt', { ascending: false });

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%,provider.ilike.%${filters.search}%`
    );
  }
  if (filters.category) query = query.ilike('category', filters.category);
  if (filters.provider) query = query.ilike('provider', filters.provider);
  if (filters.market) query = query.ilike('market', filters.market);
  if (filters.environment) query = query.eq('environment', filters.environment);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.templateId) query = query.eq('templateId', filters.templateId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ConfigurationListItem[];
}

export async function getConfiguration(id: string): Promise<ConfigurationDetail> {
  const { data, error } = await supabase
    .from('Configuration')
    .select('*, template:Template(*)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);

  const values = (data.values as Record<string, unknown>) ?? {};
  const template = data.template as Template | null;
  let resolvedFields: ResolvedField[] = [];

  if (template) {
    const fields = (template.fields as unknown as TemplateField[]) ?? [];
    resolvedFields = fields.map((field) => ({
      ...field,
      value: values[field.name] ?? field.defaultValue ?? null,
    }));
  }

  return { ...data, resolvedFields } as ConfigurationDetail;
}

export async function createConfiguration(
  payload: Partial<ConfigFormData>
): Promise<ConfigurationDetail> {
  const { templateId, ...rest } = payload;

  if (templateId) {
    const { data: tmpl } = await supabase
      .from('Template')
      .select('fields')
      .eq('id', templateId)
      .single();

    if (tmpl) {
      const fields = (tmpl.fields as unknown as TemplateField[]) ?? [];
      const values = (rest.values ?? {}) as Record<string, unknown>;
      const missing = fields.filter((f) => f.required && !values[f.name]).map((f) => f.name);
      if (missing.length > 0) throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  const row = {
    id: crypto.randomUUID(),
    name: rest.name?.trim() ?? '',
    description: rest.description ?? null,
    category: rest.category ?? null,
    type: rest.type ?? 'json',
    market: rest.market ?? null,
    provider: rest.provider ?? null,
    environment: rest.environment ?? null,
    tags: rest.tags ?? [],
    values: rest.values ?? {},
    notes: rest.notes ?? null,
    templateId: templateId ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('Configuration')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { ...data, resolvedFields: [] } as ConfigurationDetail;
}

export async function updateConfiguration(
  id: string,
  payload: Partial<ConfigFormData>
): Promise<ConfigurationDetail> {
  const updateRow: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (payload.name !== undefined) updateRow.name = payload.name.trim();
  if (payload.description !== undefined) updateRow.description = payload.description;
  if (payload.category !== undefined) updateRow.category = payload.category;
  if (payload.type !== undefined) updateRow.type = payload.type;
  if (payload.market !== undefined) updateRow.market = payload.market;
  if (payload.provider !== undefined) updateRow.provider = payload.provider;
  if (payload.environment !== undefined) updateRow.environment = payload.environment;
  if (payload.tags !== undefined) updateRow.tags = payload.tags;
  if (payload.values !== undefined) updateRow.values = payload.values;
  if (payload.notes !== undefined) updateRow.notes = payload.notes;
  if ('templateId' in payload) updateRow.templateId = payload.templateId ?? null;

  const { data, error } = await supabase
    .from('Configuration')
    .update(updateRow)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { ...data, resolvedFields: [] } as ConfigurationDetail;
}

export async function deleteConfiguration(id: string): Promise<void> {
  const { error } = await supabase.from('Configuration').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function duplicateConfiguration(id: string): Promise<ConfigurationDetail> {
  const { data: original, error: fetchError } = await supabase
    .from('Configuration')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const row = {
    ...original,
    id: crypto.randomUUID(),
    name: `${original.name} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('Configuration')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { ...data, resolvedFields: [] } as ConfigurationDetail;
}

// --- Templates ---

export async function getTemplates(): Promise<Template[]> {
  const { data, error } = await supabase
    .from('Template')
    .select('*')
    .order('updatedAt', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Template[];
}

export async function getTemplate(id: string): Promise<Template> {
  const { data, error } = await supabase
    .from('Template')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return data as Template;
}

export async function createTemplate(payload: Partial<TemplateFormData>): Promise<Template> {
  const row = {
    id: crypto.randomUUID(),
    name: payload.name?.trim() ?? '',
    description: payload.description ?? null,
    category: payload.category ?? null,
    provider: payload.provider ?? null,
    fields: payload.fields ?? [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('Template')
    .insert(row)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Template;
}

export async function updateTemplate(
  id: string,
  payload: Partial<TemplateFormData>
): Promise<Template> {
  const updateRow: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if (payload.name !== undefined) updateRow.name = payload.name.trim();
  if (payload.description !== undefined) updateRow.description = payload.description;
  if (payload.category !== undefined) updateRow.category = payload.category;
  if (payload.provider !== undefined) updateRow.provider = payload.provider;
  if (payload.fields !== undefined) updateRow.fields = payload.fields;

  const { data, error } = await supabase
    .from('Template')
    .update(updateRow)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Template;
}

export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from('Template').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- Configuration field options (distinct values for comboboxes) ---

export async function getConfigurationOptions(): Promise<{ categories: string[]; markets: string[] }> {
  const { data } = await supabase.from('Configuration').select('category, market');
  const categories = [...new Set((data ?? []).map((r) => r.category).filter(Boolean) as string[])].sort();
  const markets = [...new Set((data ?? []).map((r) => r.market).filter(Boolean) as string[])].sort();
  return { categories, markets };
}
