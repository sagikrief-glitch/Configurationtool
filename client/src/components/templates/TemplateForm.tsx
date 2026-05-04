import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { TemplateFormData, TemplateField } from '../../types';

interface TemplateFormProps {
  initial?: Partial<TemplateFormData>;
  onSubmit: (data: Partial<TemplateFormData>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  title: string;
}

const EMPTY: TemplateFormData = {
  name: '',
  description: '',
  category: '',
  provider: '',
  fields: [],
};

const NEW_FIELD: TemplateField = {
  name: '',
  label: '',
  required: false,
  type: 'string',
  defaultValue: '',
  description: '',
};

export default function TemplateForm({
  initial,
  onSubmit,
  onCancel,
  isLoading,
  title,
}: TemplateFormProps) {
  const [form, setForm] = useState<TemplateFormData>({ ...EMPTY, ...initial });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof TemplateFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addField = () =>
    set('fields', [...form.fields, { ...NEW_FIELD }]);

  const updateField = (idx: number, key: keyof TemplateField, value: unknown) =>
    set(
      'fields',
      form.fields.map((f, i) => (i === idx ? { ...f, [key]: value } : f))
    );

  const removeField = (idx: number) =>
    set('fields', form.fields.filter((_, i) => i !== idx));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    form.fields.forEach((f, i) => {
      if (!f.name.trim()) errs[`f${i}name`] = 'Field name required';
      if (!f.label.trim()) errs[`f${i}label`] = 'Field label required';
    });
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
      provider: form.provider || undefined,
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
        <Field label="Name *" error={errors.name}>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Payment Gateway Config"
            className={inp(!!errors.name)}
          />
        </Field>

        <Field label="Description">
          <input
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Short description"
            className={inp()}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. payment" className={inp()} />
          </Field>
          <Field label="Provider">
            <input value={form.provider} onChange={(e) => set('provider', e.target.value)} placeholder="e.g. Stripe" className={inp()} />
          </Field>
        </div>

        {/* Fields editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-[#8b949e]">Fields</p>
            <button
              type="button"
              onClick={addField}
              className="flex items-center gap-1 text-xs text-[#388bfd] hover:text-[#58a6ff]"
            >
              <Plus size={12} /> Add field
            </button>
          </div>

          {form.fields.length === 0 && (
            <p className="text-xs text-[#484f58] italic">No fields — add a field to define the template structure.</p>
          )}

          <div className="space-y-3">
            {form.fields.map((field, idx) => (
              <div key={idx} className="bg-[#161b22] border border-[#30363d] rounded-md p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#8b949e]">Field {idx + 1}</span>
                  <button type="button" onClick={() => removeField(idx)} className="text-[#f85149] hover:text-red-300">
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Name *" error={errors[`f${idx}name`]}>
                    <input
                      value={field.name}
                      onChange={(e) => updateField(idx, 'name', e.target.value)}
                      placeholder="field_key"
                      className={`${inp(!!errors[`f${idx}name`])} font-mono`}
                    />
                  </Field>
                  <Field label="Label *" error={errors[`f${idx}label`]}>
                    <input
                      value={field.label}
                      onChange={(e) => updateField(idx, 'label', e.target.value)}
                      placeholder="Display label"
                      className={inp(!!errors[`f${idx}label`])}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Type">
                    <select value={field.type} onChange={(e) => updateField(idx, 'type', e.target.value)} className={inp()}>
                      {['string', 'number', 'boolean', 'json', 'url'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Default value">
                    <input
                      value={field.defaultValue ?? ''}
                      onChange={(e) => updateField(idx, 'defaultValue', e.target.value)}
                      placeholder="Optional default"
                      className={inp()}
                    />
                  </Field>
                </div>

                <Field label="Description">
                  <input
                    value={field.description ?? ''}
                    onChange={(e) => updateField(idx, 'description', e.target.value)}
                    placeholder="What is this field for?"
                    className={inp()}
                  />
                </Field>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(idx, 'required', e.target.checked)}
                    className="accent-[#388bfd]"
                  />
                  <span className="text-xs text-[#8b949e]">Required field</span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-[#30363d] shrink-0 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-[#8b949e] border border-[#30363d] rounded-md hover:text-[#e6edf3]">
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#8b949e] mb-1">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  );
}

const inp = (hasError = false) =>
  `w-full px-3 py-2 bg-[#0f1117] border rounded-md text-sm text-[#e6edf3] placeholder-[#484f58] focus:outline-none focus:ring-1 ${
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : 'border-[#30363d] focus:border-[#388bfd] focus:ring-[#388bfd]/20'
  }`;
