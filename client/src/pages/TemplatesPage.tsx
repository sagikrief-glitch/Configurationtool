import { useState } from 'react';
import { Plus, LayoutTemplate, Trash2, Edit, ChevronRight } from 'lucide-react';
import TemplateForm from '../components/templates/TemplateForm';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '../hooks/useTemplates';
import { useToast } from '../components/ui/ToastProvider';
import type { Template, TemplateField, TemplateFormData } from '../types';

export default function TemplatesPage() {
  const { toast } = useToast();
  const { data: templates = [], isLoading } = useTemplates();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [selected, setSelected] = useState<Template | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');

  const handleCreate = async (data: Partial<TemplateFormData>) => {
    try {
      await createMutation.mutateAsync(data);
      setMode('list');
      toast('Template created');
    } catch {
      toast('Failed to save — check the server is running', 'error');
    }
  };

  const handleEdit = async (data: Partial<TemplateFormData>) => {
    if (!selected) return;
    try {
      await updateMutation.mutateAsync({ id: selected.id, data });
      setMode('list');
      setSelected(null);
      toast('Template saved');
    } catch {
      toast('Failed to save — check the server is running', 'error');
    }
  };

  const handleDelete = async (t: Template) => {
    if (!confirm(`Delete template "${t.name}"? Existing configurations using it will keep their data.`)) return;
    await deleteMutation.mutateAsync(t.id);
    toast('Template deleted', 'error');
  };

  if (mode === 'create') {
    return (
      <div className="h-full max-w-2xl mx-auto">
        <TemplateForm
          title="New Template"
          onSubmit={handleCreate}
          onCancel={() => setMode('list')}
          isLoading={createMutation.isPending}
        />
      </div>
    );
  }

  if (mode === 'edit' && selected) {
    return (
      <div className="h-full max-w-2xl mx-auto">
        <TemplateForm
          title={`Edit: ${selected.name}`}
          initial={{
            name: selected.name,
            description: selected.description ?? '',
            category: selected.category ?? '',
            provider: selected.provider ?? '',
            fields: selected.fields as TemplateField[],
          }}
          onSubmit={handleEdit}
          onCancel={() => { setMode('list'); setSelected(null); }}
          isLoading={updateMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b border-[#30363d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={16} className="text-[#388bfd]" />
          <h1 className="text-sm font-semibold text-[#e6edf3]">Templates</h1>
          <span className="text-xs text-[#484f58]">{templates.length}</span>
        </div>
        <button
          onClick={() => setMode('create')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#238636] border border-[#2ea043] rounded-md hover:bg-[#2ea043]"
        >
          <Plus size={13} /> New Template
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && <p className="text-sm text-[#484f58]">Loading…</p>}

        {!isLoading && templates.length === 0 && (
          <div className="text-center py-16">
            <LayoutTemplate size={32} className="text-[#30363d] mx-auto mb-3" />
            <p className="text-sm text-[#8b949e] mb-1">No templates yet</p>
            <p className="text-xs text-[#484f58] mb-4">
              Templates define reusable config structures with required fields.
            </p>
            <button
              onClick={() => setMode('create')}
              className="text-xs text-[#388bfd] hover:text-[#58a6ff]"
            >
              + Create your first template
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 max-w-3xl">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-3 hover:border-[#388bfd33] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-[#e6edf3]">{t.name}</h3>
                    {t.category && (
                      <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
                        {t.category}
                      </span>
                    )}
                    {t.provider && (
                      <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
                        {t.provider}
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-xs text-[#8b949e] mb-2">{t.description}</p>
                  )}

                  {/* Field summary */}
                  {(t.fields as TemplateField[]).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {(t.fields as TemplateField[]).slice(0, 6).map((f) => (
                        <span
                          key={f.name}
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                            f.required
                              ? 'text-red-400 bg-red-400/10 border-red-400/20'
                              : 'text-[#8b949e] bg-[#21262d] border-[#30363d]'
                          }`}
                        >
                          {f.name}
                          {f.required ? '*' : ''}
                        </span>
                      ))}
                      {(t.fields as TemplateField[]).length > 6 && (
                        <span className="text-[10px] text-[#484f58]">
                          +{(t.fields as TemplateField[]).length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setSelected(t); setMode('edit'); }}
                    className="p-1.5 text-[#8b949e] hover:text-[#e6edf3] border border-transparent hover:border-[#30363d] rounded"
                    title="Edit template"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-1.5 text-[#f85149] border border-transparent hover:border-[#f8514933] rounded"
                    title="Delete template"
                  >
                    <Trash2 size={13} />
                  </button>
                  <ChevronRight size={13} className="text-[#484f58]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
