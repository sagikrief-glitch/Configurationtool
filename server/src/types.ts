// Shared TypeScript types — used by both backend logic and API response shaping
// Backend Developer: these types mirror the Prisma schema + API contract agreed with Frontend

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
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigurationDetail extends ConfigurationListItem {
  values: Record<string, unknown>;
  notes: string | null;
  resolvedFields: ResolvedField[];
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
