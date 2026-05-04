import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/client';
import type { TemplateFormData } from '../types';

export const templateKeys = {
  all: ['templates'] as const,
  list: () => [...templateKeys.all, 'list'] as const,
  detail: (id: string) => [...templateKeys.all, 'detail', id] as const,
};

export function useTemplates() {
  return useQuery({
    queryKey: templateKeys.list(),
    queryFn: api.getTemplates,
  });
}

export function useTemplate(id: string | null) {
  return useQuery({
    queryKey: templateKeys.detail(id ?? ''),
    queryFn: () => api.getTemplate(id!),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TemplateFormData>) => api.createTemplate(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateFormData> }) =>
      api.updateTemplate(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: templateKeys.all });
      qc.invalidateQueries({ queryKey: templateKeys.detail(vars.id) });
    },
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: templateKeys.all }),
  });
}
