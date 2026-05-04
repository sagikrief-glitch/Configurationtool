// Shared types — mirrors server/src/types.ts
// Frontend Developer: agreed shape with Backend Developer (Entry 3 in AGENT_TEAM_REFERENCES.md)

export interface TemplateField {
  name: string;
  label: string;
  required: boolean;
  defaultValue?: string | null;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json' | 'url';
}

export interface ResolvedField extends TemplateField {
  value: unknown;
}

export interface ConfigurationListItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string;
  market: string | null;
  provider: string | null;
  environment: string | null;
  tags: string[];
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationDetail extends ConfigurationListItem {
  values: Record<string, unknown>;
  notes: string | null;
  resolvedFields: ResolvedField[];
  template?: Template | null;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  provider: string | null;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
  _count?: { configurations: number };
}

export interface ConfigurationFilters {
  search?: string;
  category?: string;
  provider?: string;
  market?: string;
  environment?: string;
  type?: string;
  templateId?: string;
}

export type ConfigFormData = {
  name: string;
  description: string;
  category: string;
  type: string;
  market: string;
  provider: string;
  environment: string;
  tags: string[];
  values: Record<string, unknown>;
  notes: string;
  templateId: string | null;
};

export type TemplateFormData = {
  name: string;
  description: string;
  category: string;
  provider: string;
  fields: TemplateField[];
};
