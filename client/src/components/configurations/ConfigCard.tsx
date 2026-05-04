import type { ConfigurationListItem } from '../../types';
import { formatDistanceToNow } from '../utils/formatDate';

interface ConfigCardProps {
  config: ConfigurationListItem;
  isSelected: boolean;
  onClick: () => void;
}

const ENV_COLORS: Record<string, string> = {
  prod: 'text-red-400 bg-red-400/10 border-red-400/20',
  staging: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  dev: 'text-green-400 bg-green-400/10 border-green-400/20',
  other: 'text-gray-400 bg-gray-400/10 border-gray-400/20',
};

export default function ConfigCard({ config, isSelected, onClick }: ConfigCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 border-b border-[#21262d] transition-colors ${
        isSelected ? 'bg-[#1f6feb1a]' : 'hover:bg-[#161b22]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className={`text-sm font-medium truncate ${isSelected ? 'text-[#58a6ff]' : 'text-[#e6edf3]'}`}>
          {config.name}
        </span>
        {config.environment && (
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded border font-mono ${ENV_COLORS[config.environment] ?? ENV_COLORS.other}`}>
            {config.environment}
          </span>
        )}
      </div>

      {config.description && (
        <p className="text-xs text-[#8b949e] truncate mb-1.5">{config.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {config.category && (
          <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            {config.category}
          </span>
        )}
        {config.provider && (
          <span className="text-[10px] text-[#8b949e] bg-[#21262d] px-1.5 py-0.5 rounded">
            {config.provider}
          </span>
        )}
        {config.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-[10px] text-[#388bfd] bg-[#388bfd11] px-1.5 py-0.5 rounded">
            {tag}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-[#484f58] mt-1.5">
        {formatDistanceToNow(config.updatedAt)}
      </p>
    </button>
  );
}
