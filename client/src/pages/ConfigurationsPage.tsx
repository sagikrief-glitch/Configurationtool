import { useState, useDeferredValue } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import ConfigCard from '../components/configurations/ConfigCard';
import ConfigDetail from '../components/configurations/ConfigDetail';
import ConfigForm from '../components/configurations/ConfigForm';
import {
  useConfigurations,
  useConfiguration,
  useCreateConfiguration,
  useUpdateConfiguration,
  useDeleteConfiguration,
  useDuplicateConfiguration,
} from '../hooks/useConfigurations';
import { useTemplates } from '../hooks/useTemplates';
import { useToast } from '../components/ui/ToastProvider';
import type { ConfigFormData, ConfigurationFilters } from '../types';

type PanelMode = 'detail' | 'create' | 'edit' | null;

export default function ConfigurationsPage() {
  const navigate = useNavigate();
  const { id: selectedId } = useParams<{ id: string }>();

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [filters, setFilters] = useState<ConfigurationFilters>({});
  const [panelMode, setPanelMode] = useState<PanelMode>(selectedId ? 'detail' : null);

  const { toast } = useToast();
  const { data: configs = [], isLoading } = useConfigurations({
    ...filters,
    search: deferredSearch || undefined,
  });
  const { data: detail } = useConfiguration(
    panelMode !== 'create' ? (selectedId ?? null) : null
  );
  const { data: templates = [] } = useTemplates();

  const createMutation = useCreateConfiguration();
  const updateMutation = useUpdateConfiguration();
  const deleteMutation = useDeleteConfiguration();
  const duplicateMutation = useDuplicateConfiguration();

  const selectConfig = (id: string) => {
    navigate(`/configurations/${id}`);
    setPanelMode('detail');
  };

  const handleCreate = () => {
    navigate('/configurations');
    setPanelMode('create');
  };

  const handleDelete = async () => {
    if (!selectedId || deleteMutation.isPending || !confirm('Delete this configuration?')) return;
    await deleteMutation.mutateAsync(selectedId);
    navigate('/configurations');
    setPanelMode(null);
    toast('Configuration deleted', 'error');
  };

  const handleDuplicate = async () => {
    if (!selectedId) return;
    const copy = await duplicateMutation.mutateAsync(selectedId);
    navigate(`/configurations/${copy.id}`);
    setPanelMode('detail');
    toast('Configuration duplicated');
  };

  const handleSubmitCreate = async (data: Partial<ConfigFormData>) => {
    try {
      const created = await createMutation.mutateAsync(data);
      navigate(`/configurations/${created.id}`);
      setPanelMode('detail');
      toast('Configuration created');
    } catch {
      toast('Failed to save — check the server is running', 'error');
    }
  };

  const handleSubmitEdit = async (data: Partial<ConfigFormData>) => {
    if (!selectedId) return;
    try {
      await updateMutation.mutateAsync({ id: selectedId, data });
      setPanelMode('detail');
      toast('Configuration saved');
    } catch {
      toast('Failed to save — check the server is running', 'error');
    }
  };

  const setFilter = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));

  const clearFilters = () => setFilters({});

  return (
    <div className="flex h-full">
      {/* Left: list */}
      <div className="w-80 shrink-0 flex flex-col border-r border-[#30363d] h-full">
        <div className="px-3 py-3 border-b border-[#30363d] space-y-2">
          <div className="flex items-center gap-2">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search configurations…"
            />
            <button
              onClick={handleCreate}
              className="shrink-0 p-2 rounded-md bg-[#238636] border border-[#2ea043] text-white hover:bg-[#2ea043]"
              title="New configuration"
            >
              <Plus size={15} />
            </button>
          </div>
          <FilterBar filters={filters as Record<string, string>} onChange={setFilter} onClear={clearFilters} />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-8 text-center text-sm text-[#484f58]">Loading…</div>
          )}
          {!isLoading && configs.length === 0 && (
            <div className="px-4 py-12 text-center">
              <p className="text-sm text-[#8b949e] mb-2">No configurations found</p>
              <button onClick={handleCreate} className="text-xs text-[#388bfd] hover:text-[#58a6ff]">
                + Create one
              </button>
            </div>
          )}
          {configs.map((config) => (
            <ConfigCard
              key={config.id}
              config={config}
              isSelected={config.id === selectedId}
              onClick={() => selectConfig(config.id)}
            />
          ))}
        </div>

        <div className="px-3 py-2 border-t border-[#30363d]">
          <p className="text-[11px] text-[#484f58]">
            {configs.length} configuration{configs.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Right: panel */}
      <div className="flex-1 overflow-hidden bg-[#0f1117]">
        {panelMode === 'create' && (
          <ConfigForm
            title="New Configuration"
            templates={templates}
            onSubmit={handleSubmitCreate}
            onCancel={() => setPanelMode(null)}
            isLoading={createMutation.isPending}
          />
        )}

        {panelMode === 'edit' && detail && (
          <ConfigForm
            title="Edit Configuration"
            templates={templates}
            initial={{
              name: detail.name,
              description: detail.description ?? '',
              category: detail.category ?? '',
              type: detail.type,
              market: detail.market ?? '',
              provider: detail.provider ?? '',
              environment: detail.environment ?? '',
              tags: detail.tags,
              values: detail.values,
              notes: detail.notes ?? '',
              templateId: detail.templateId,
            }}
            onSubmit={handleSubmitEdit}
            onCancel={() => setPanelMode('detail')}
            isLoading={updateMutation.isPending}
          />
        )}

        {panelMode === 'detail' && detail && (
          <ConfigDetail
            config={detail}
            onEdit={() => setPanelMode('edit')}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        )}

        {!panelMode && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-[#484f58] text-sm mb-2">Select a configuration</p>
              <button onClick={handleCreate} className="text-xs text-[#388bfd] hover:text-[#58a6ff]">
                + Create new
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
