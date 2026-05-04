import { X } from 'lucide-react';

interface FilterBarProps {
  filters: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

const FILTER_OPTIONS = {
  environment: ['dev', 'staging', 'prod', 'other'],
  type: ['json', 'yaml', 'kv', 'other'],
};

const FILTER_LABELS: Record<string, string> = {
  category: 'Category',
  provider: 'Provider',
  market: 'Market',
  environment: 'Environment',
  type: 'Type',
};

export default function FilterBar({ filters, onChange, onClear }: FilterBarProps) {
  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {Object.entries(FILTER_LABELS).map(([key, label]) => {
        const options = FILTER_OPTIONS[key as keyof typeof FILTER_OPTIONS];
        return options ? (
          <select
            key={key}
            value={filters[key] ?? ''}
            onChange={(e) => onChange(key, e.target.value)}
            className={`px-2 py-1.5 rounded-md text-xs border bg-[#161b22] text-[#8b949e] focus:outline-none focus:border-[#388bfd] cursor-pointer ${
              filters[key] ? 'border-[#388bfd] text-[#58a6ff]' : 'border-[#30363d]'
            }`}
          >
            <option value="">{label}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            key={key}
            type="text"
            value={filters[key] ?? ''}
            onChange={(e) => onChange(key, e.target.value)}
            placeholder={label}
            className={`px-2 py-1.5 rounded-md text-xs border bg-[#161b22] focus:outline-none focus:border-[#388bfd] w-28 ${
              filters[key]
                ? 'border-[#388bfd] text-[#58a6ff]'
                : 'border-[#30363d] text-[#8b949e] placeholder-[#484f58]'
            }`}
          />
        );
      })}

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1.5 text-xs text-[#f85149] border border-[#f8514933] rounded-md hover:bg-[#f8514911]"
        >
          <X size={11} />
          Clear
        </button>
      )}
    </div>
  );
}
