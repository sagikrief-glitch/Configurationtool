import { useState } from 'react';
import {
  Copy,
  Download,
  Edit,
  Trash2,
  CopyPlus,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react';
import type { ConfigurationDetail } from '../../types';
import { useToast } from '../ui/ToastProvider';
import * as yaml from 'js-yaml';

interface ConfigDetailProps {
  config: ConfigurationDetail;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const ENV_COLORS: Record<string, string> = {
  prod: 'text-red-400 bg-red-400/10 border-red-400/20',
  staging: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  dev: 'text-green-400 bg-green-400/10 border-green-400/20',
  other: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

// Derive copyable text and display content from values + type
function resolveContent(
  type: string,
  values: Record<string, unknown>
): { display: 'json' | 'raw' | 'kv'; text: string } {
  if (type === 'yaml' || type === 'script' || type === 'other') {
    const raw = typeof values.__content === 'string' ? values.__content : '';
    return { display: 'raw', text: raw };
  }
  if (type === 'kv') {
    const entries = Object.entries(values).filter(([k]) => k !== '__content');
    const text = entries.map(([k, v]) => `${k}=${v}`).join('\n');
    return { display: 'kv', text };
  }
  // json (default)
  return { display: 'json', text: JSON.stringify(values, null, 2) };
}

export default function ConfigDetail({
  config,
  onEdit,
  onDelete,
  onDuplicate,
}: ConfigDetailProps) {
  const { toast } = useToast();
  const [showNotes, setShowNotes] = useState(true);
  const [showValues, setShowValues] = useState(true);

  const values = (config.values ?? {}) as Record<string, unknown>;
  const { display, text: copyText } = resolveContent(config.type, values);

  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    toast('Copied to clipboard');
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(values, null, 2)], { type: 'application/json' });
    download(blob, `${slug(config.name)}.json`);
    toast('Exported as JSON');
  };

  const handleExportYAML = () => {
    let content: string;
    if (display === 'raw' && config.type === 'yaml') {
      content = copyText;
    } else if (display === 'kv') {
      content = yaml.dump(values);
    } else {
      content = yaml.dump(values);
    }
    const blob = new Blob([content], { type: 'text/yaml' });
    download(blob, `${slug(config.name)}.yaml`);
    toast('Exported as YAML');
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#30363d] shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-base font-semibold text-[#e6edf3] leading-tight">{config.name}</h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <ActionButton icon={<CopyPlus size={14} />} label="Duplicate" onClick={onDuplicate} />
            <ActionButton icon={<Edit size={14} />} label="Edit" onClick={onEdit} variant="primary" />
            <ActionButton icon={<Trash2 size={14} />} label="Delete" onClick={onDelete} variant="danger" />
          </div>
        </div>

        {config.description && (
          <p className="text-sm text-[#8b949e] mb-3">{config.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {config.environment && (
            <span className={`text-xs px-2 py-0.5 rounded border font-mono ${ENV_COLORS[config.environment] ?? ENV_COLORS.other}`}>
              {config.environment}
            </span>
          )}
          {config.type && (
            <span className="text-xs px-2 py-0.5 rounded border border-[#30363d] text-[#8b949e] font-mono">
              {config.type}
            </span>
          )}
          {config.category && <Meta label="category" value={config.category} />}
          {config.provider && <Meta label="provider" value={config.provider} />}
          {config.market && <Meta label="market" value={config.market} />}
        </div>

        {config.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {config.tags.map((tag) => (
              <span key={tag} className="text-xs text-[#388bfd] bg-[#388bfd11] px-2 py-0.5 rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Notes */}
        {config.notes && (
          <section>
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-2 hover:text-[#e6edf3] w-full"
            >
              <FileText size={12} />
              Notes
              {showNotes ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
            </button>
            {showNotes && (
              <p className="text-sm text-[#8b949e] bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5 whitespace-pre-wrap">
                {config.notes}
              </p>
            )}
          </section>
        )}

        {/* Resolved fields (template-based) */}
        {config.resolvedFields.length > 0 && (
          <section>
            <p className="text-xs font-medium text-[#8b949e] uppercase tracking-wider mb-2">Fields</p>
            <div className="space-y-2">
              {config.resolvedFields.map((field) => (
                <div key={field.name} className="bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[#e6edf3]">{field.name}</span>
                    {field.required && (
                      <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 rounded">required</span>
                    )}
                    <span className="text-[10px] text-[#484f58] ml-auto">{field.type}</span>
                  </div>
                  {field.description && (
                    <p className="text-[11px] text-[#8b949e] mb-1">{field.description}</p>
                  )}
                  <code className="text-xs text-[#79c0ff] break-all">
                    {field.value != null ? String(field.value) : <span className="text-[#484f58] italic">empty</span>}
                  </code>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Values section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setShowValues((v) => !v)}
              className="flex items-center gap-2 text-xs font-medium text-[#8b949e] uppercase tracking-wider hover:text-[#e6edf3]"
            >
              Values
              {showValues ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#e6edf3] px-2 py-1 rounded border border-[#30363d] hover:border-[#8b949e]"
              >
                <Copy size={11} /> Copy
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#e6edf3] px-2 py-1 rounded border border-[#30363d] hover:border-[#8b949e]"
              >
                <Download size={11} /> JSON
              </button>
              <button
                onClick={handleExportYAML}
                className="flex items-center gap-1 text-[10px] text-[#8b949e] hover:text-[#e6edf3] px-2 py-1 rounded border border-[#30363d] hover:border-[#8b949e]"
              >
                <Download size={11} /> YAML
              </button>
            </div>
          </div>

          {showValues && (
            <>
              {/* JSON display */}
              {display === 'json' && (
                <pre className="text-xs text-[#79c0ff] bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                  {JSON.stringify(values, null, 2)}
                </pre>
              )}

              {/* Raw text display (yaml / script / other) */}
              {display === 'raw' && (
                <pre className="text-xs text-[#79c0ff] bg-[#161b22] border border-[#30363d] rounded-md px-3 py-2.5 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
                  {copyText || <span className="text-[#484f58] italic">empty</span>}
                </pre>
              )}

              {/* KV table display */}
              {display === 'kv' && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-md overflow-hidden">
                  {Object.entries(values).filter(([k]) => k !== '__content').length === 0 ? (
                    <p className="text-xs text-[#484f58] italic px-3 py-2.5">No key-value pairs</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-[#30363d]">
                          <th className="text-left px-3 py-2 text-[#484f58] font-medium w-2/5">Key</th>
                          <th className="text-left px-3 py-2 text-[#484f58] font-medium">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(values)
                          .filter(([k]) => k !== '__content')
                          .map(([k, v], i) => (
                            <tr key={k} className={i % 2 === 0 ? '' : 'bg-[#0f1117]'}>
                              <td className="px-3 py-2 font-mono text-[#e6edf3] break-all">{k}</td>
                              <td className="px-3 py-2 font-mono text-[#79c0ff] break-all">{String(v)}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-xs text-[#8b949e]">
      <span className="text-[#484f58]">{label}:</span> {value}
    </span>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  variant = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
}) {
  const cls = {
    default: 'text-[#8b949e] border-[#30363d] hover:text-[#e6edf3] hover:border-[#8b949e]',
    primary: 'text-[#388bfd] border-[#388bfd44] hover:bg-[#388bfd11]',
    danger: 'text-[#f85149] border-[#f8514933] hover:bg-[#f8514911]',
  }[variant];

  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center gap-1 px-2 py-1.5 text-xs rounded border ${cls} transition-colors`}
    >
      {icon}
      {label}
    </button>
  );
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
