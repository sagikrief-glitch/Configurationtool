import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import type { ConfigFormData, Template, TemplateField } from '../../types';
import { useConfigurationOptions } from '../../hooks/useConfigurations';

interface ConfigFormProps {
  initial?: Partial<ConfigFormData>;
  templates: Template[];
  onSubmit: (data: Partial<ConfigFormData>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title: string;
}

const EMPTY: ConfigFormData = {
  name: '',
  description: '',
  category: '',
  type: 'json',
  market: '',
  provider: '',
  environment: '',
  tags: [],
  values: {},
  notes: '',
  templateId: null,
};

const TYPES = ['json', 'yaml', 'kv', 'script', 'other'] as const;
type ConfigType = (typeof TYPES)[number];

// Extract raw text content from a __content wrapper, or serialise JSON as fallback
function getRawContent(values: Record<string, unknown>): string {
  if (typeof values.__content === 'string') return values.__content;
  return '';
}

// Convert values object to KV rows
function toKvRows(values: Record<string, unknown>): [string, string][] {
  const entries = Object.entries(values).filter(([k]) => k !== '__content');
  if (entries.length === 0) return [['', '']];
  return entries.map(([k, v]) => [k, String(v)]);
}

// Convert KV rows to a plain object
function kvRowsToObject(rows: [string, string][]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of rows) {
    if (k.trim()) obj[k.trim()] = v;
  }
  return obj;
}

export default function ConfigForm({
  initial,
  templates,
  onSubmit,
  onCancel,
  isLoading,
  title,
}: ConfigFormProps) {
  const [form, setForm] = useState<ConfigFormData>({ ...EMPTY, ...initial });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: configOptions } = useConfigurationOptions();
  const categories = configOptions?.categories ?? [];
  const markets = configOptions?.markets ?? [];

  // JSON editor state
  const [jsonText, setJsonText] = useState(
    JSON.stringify(initial?.values ?? {}, null, 2)
  );
  const [jsonError, setJsonError] = useState('');

  // Raw text editor state (yaml / script / other)
  const [rawText, setRawText] = useState(() => getRawContent((initial?.values ?? {}) as Record<string, unknown>));

  // KV editor state
  const [kvRows, setKvRows] = useState<[string, string][]>(() =>
    toKvRows((initial?.values ?? {}) as Record<string, unknown>)
  );

  const selectedTemplate = templates.find((t) => t.id === form.templateId) ?? null;
  const type = form.type as ConfigType;

  // When template changes, merge defaults into the json editor
  useEffect(() => {
    if (selectedTemplate) {
      const defaults: Record<string, unknown> = {};
      (selectedTemplate.fields as TemplateField[]).forEach((f) => {
        if (f.defaultValue != null) defaults[f.name] = f.defaultValue;
      });
      const merged = { ...defaults, ...form.values };
      setJsonText(JSON.stringify(merged, null, 2));
      setForm((prev) => ({ ...prev, values: merged }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.templateId]);

  const set = (key: keyof ConfigFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // --- JSON handlers ---
  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setForm((prev) => ({ ...prev, values: parsed }));
      setJsonError('');
    } catch {
      setJsonError('Invalid JSON');
    }
  };

  // --- Raw text handlers (yaml / script / other) ---
  const handleRawChange = (text: string) => {
    setRawText(text);
    setForm((prev) => ({ ...prev, values: { __content: text } }));
  };

  // --- KV handlers ---
  const handleKvChange = (rows: [string, string][]) => {
    setKvRows(rows);
    setForm((prev) => ({ ...prev, values: kvRowsToObject(rows) }));
  };

  const addKvRow = () => handleKvChange([...kvRows, ['', '']]);
  const removeKvRow = (i: number) => handleKvChange(kvRows.filter((_, idx) => idx !== i));
  const updateKvRow = (i: number, col: 0 | 1, val: string) => {
    const next = kvRows.map((r, idx) => (idx === i ? ([col === 0 ? val : r[0], col === 1 ? val : r[1]] as [string, string]) : r));
    handleKvChange(next);
  };

  // --- Tags ---
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };
  const removeTag = (tag: string) => set('tags', form.tags.filter((t) => t !== tag));

  // --- Validation ---
  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (type === 'json' && jsonError) errs.values = jsonError;

    if (selectedTemplate) {
      (selectedTemplate.fields as TemplateField[]).forEach((f) => {
        if (f.required && !form.values[f.name]) {
          errs[`field_${f.name}`] = `${f.label} is required`;
        }
      });
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...form,
      name: form.name.trim(),
      description: form.description || undefined,
      category: form.category || undefined,
      market: form.market || undefined,
      provider: form.provider || undefined,
      environment: form.environment || undefined,
      notes: form.notes || undefined,
      templateId: form.templateId || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-[#30363d] shrink-0 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[#e6edf3]">{title}</h2>
        <button type="button" onClick={onCancel} className="text-[#8b949e] hover:text-[#e6edf3]">
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Template picker */}
        <Field label="Template" hint="Optional — pre-fills fields and sets required field rules">
          <select
            value={form.templateId ?? ''}
            onChange={(e) => set('templateId', e.target.value || null)}
            className={input()}
          >
            <option value="">None (from scratch)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>

        {/* Name */}
        <Field label="Name *" error={errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Stripe Production Config"
            className={input(!!errors.name)}
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <input
            type="text"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Short description"
            className={input()}
          />
        </Field>

        {/* Category + Provider */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              list="category-options"
              placeholder="e.g. payment"
              className={input()}
            />
            <datalist id="category-options">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </Field>
          <Field label="Provider">
            <input value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. Stripe" className={input()} />
          </Field>
        </div>

        {/* Market + Environment + Type */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Market">
            <input
              value={form.market}
              onChange={(e) => set('market', e.target.value)}
              list="market-options"
              placeholder="e.g. US"
              className={input()}
            />
            <datalist id="market-options">
              {markets.map((m) => <option key={m} value={m} />)}
            </datalist>
          </Field>
          <Field label="Environment">
            <select value={form.environment} onChange={(e) => set('environment', e.target.value)} className={input()}>
              <option value="">Any</option>
              {['dev', 'staging', 'prod', 'other'].map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className={input()}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Tags */}
        <Field label="Tags">
          <div className="flex items-center gap-2 mb-1.5">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
              placeholder="Add tag, press Enter"
              className={`${input()} flex-1`}
            />
            <button type="button" onClick={addTag} className="p-2 rounded border border-[#30363d] text-[#8b949e] hover:text-[#e6edf3]">
              <Plus size={14} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-xs text-[#388bfd] bg-[#388bfd11] px-2 py-0.5 rounded">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400"><Minus size={10} /></button>
              </span>
            ))}
          </div>
        </Field>

        {/* Template required fields hints */}
        {selectedTemplate && (selectedTemplate.fields as TemplateField[]).length > 0 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5">
            <p className="text-xs font-medium text-[#8b949e] mb-2">Required fields from template</p>
            {(selectedTemplate.fields as TemplateField[]).filter(f => f.required).map((f) => (
              <p key={f.name} className={`text-xs ${errors[`field_${f.name}`] ? 'text-red-400' : 'text-[#8b949e]'}`}>
                • {f.label} ({f.name}) {errors[`field_${f.name}`] ? '— required' : ''}
              </p>
            ))}
          </div>
        )}

        {/* Values editor — adapts to type */}
        {type === 'json' && (
          <Field label="Values (JSON)" error={errors.values ?? jsonError}>
            {selectedTemplate && (selectedTemplate.fields as TemplateField[]).length > 0 && (
              <div className="mb-1.5 flex flex-wrap gap-1">
                {(selectedTemplate.fields as TemplateField[]).map((f) => (
                  <span
                    key={f.name}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${
                      f.required
                        ? 'text-red-400 bg-red-400/10 border-red-400/20'
                        : 'text-[#8b949e] bg-[#21262d] border-[#30363d]'
                    }`}
                    title={f.description}
                  >
                    {f.name}{f.required ? '*' : ''}
                  </span>
                ))}
                <span className="text-[10px] text-[#484f58]">* = required in template</span>
              </div>
            )}
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              rows={10}
              spellCheck={false}
              className={`${input(!!jsonError)} font-mono text-xs resize-y leading-relaxed`}
            />
          </Field>
        )}

        {(type === 'yaml') && (
          <Field label="Values (YAML)">
            <textarea
              value={rawText}
              onChange={(e) => handleRawChange(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder={'key: value\nfoo: bar\nlist:\n  - item1\n  - item2'}
              className={`${input()} font-mono text-xs resize-y leading-relaxed`}
            />
          </Field>
        )}

        {type === 'kv' && (
          <Field label="Key-Value Pairs">
            <div className="space-y-2">
              {kvRows.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={row[0]}
                    onChange={(e) => updateKvRow(i, 0, e.target.value)}
                    placeholder="key"
                    className={`${input()} flex-1 font-mono text-xs`}
                  />
                  <span className="text-[#484f58] text-xs shrink-0">=</span>
                  <input
                    value={row[1]}
                    onChange={(e) => updateKvRow(i, 1, e.target.value)}
                    placeholder="value"
                    className={`${input()} flex-1 font-mono text-xs`}
                  />
                  <button
                    type="button"
                    onClick={() => removeKvRow(i)}
                    disabled={kvRows.length === 1}
                    className="p-1.5 rounded border border-[#30363d] text-[#8b949e] hover:text-red-400 disabled:opacity-30"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addKvRow}
                className="flex items-center gap-1.5 text-xs text-[#388bfd] hover:text-[#79c0ff] mt-1"
              >
                <Plus size={12} /> Add row
              </button>
            </div>
          </Field>
        )}

        {(type === 'script' || type === 'other') && (
          <Field label={type === 'script' ? 'Script' : 'Content'}>
            <textarea
              value={rawText}
              onChange={(e) => handleRawChange(e.target.value)}
              rows={12}
              spellCheck={false}
              placeholder={type === 'script' ? '#!/bin/bash\n# paste your script here' : 'Paste content here...'}
              className={`${input()} font-mono text-xs resize-y leading-relaxed`}
            />
          </Field>
        )}

        {/* Notes */}
        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Implementation context, gotchas, references..."
            className={`${input()} resize-y`}
          />
        </Field>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#30363d] shrink-0 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-[#8b949e] border border-[#30363d] rounded-md hover:text-[#e6edf3] hover:border-[#8b949e]">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-[#238636] border border-[#2ea043] rounded-md hover:bg-[#2ea043] disabled:opacity-50"
        >
          {isLoading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8b949e] mb-1">{label}</label>
      {hint && <p className="text-[11px] text-[#484f58] mb-1">{hint}</p>}
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

const input = (hasError = false) =>
  `w-full px-3 py-2 bg-[#0f1117] border rounded-md text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:ring-1 ${
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-[#30363d] focus:border-[#388bfd] focus:ring-[#388bfd]/20'
  }`;
