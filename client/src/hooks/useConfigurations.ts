import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/client';
import type { ConfigurationFilters, ConfigFormData } from '../types';

export const configKeys = {
  all: ['configurations'] as const,
  list: (filters: ConfigurationFilters) => [...configKeys.all, 'list', filters] as const,
  detail: (id: string) => [...configKeys.all, 'detail', id] as const,
};

export function useConfigurations(filters: ConfigurationFilters = {}) {
  return useQuery({
    queryKey: configKeys.list(filters),
    queryFn: () => api.getConfigurations(filters),
  });
}

export function useConfiguration(id: string | null) {
  return useQuery({
    queryKey: configKeys.detail(id ?? ''),
    queryFn: () => api.getConfiguration(id!),
    enabled: !!id,
  });
}

export function useCreateConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ConfigFormData>) => api.createConfiguration(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.all }),
  });
}

export function useUpdateConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ConfigFormData> }) =>
      api.updateConfiguration(id, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: configKeys.all });
      qc.invalidateQueries({ queryKey: configKeys.detail(vars.id) });
    },
  });
}

export function useDeleteConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteConfiguration(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.all }),
  });
}

export function useDuplicateConfiguration() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.duplicateConfiguration(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: configKeys.all }),
  });
}

export function useConfigurationOptions() {
  return useQuery({
    queryKey: ['configuration-options'],
    queryFn: api.getConfigurationOptions,
    staleTime: 30_000,
  });
}
