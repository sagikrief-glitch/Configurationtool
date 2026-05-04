import { NavLink } from 'react-router-dom';
import { Database, LayoutTemplate, Settings } from 'lucide-react';

export default function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#1f6feb33] text-[#58a6ff]'
        : 'text-[#8b949e] hover:text-[#e6edf3] hover:bg-[#21262d]'
    }`;

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-[#30363d] bg-[#161b22] h-full">
      <div className="px-4 py-4 border-b border-[#30363d]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#388bfd] flex items-center justify-center">
            <Database size={14} className="text-white" />
          </div>
          <span className="font-semibold text-[#e6edf3] text-sm">ConfigTool</span>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        <NavLink to="/configurations" className={linkClass}>
          <Database size={15} />
          Configurations
        </NavLink>
        <NavLink to="/templates" className={linkClass}>
          <LayoutTemplate size={15} />
          Templates
        </NavLink>
      </nav>

      <div className="px-2 py-3 border-t border-[#30363d]">
        <NavLink to="/settings" className={linkClass}>
          <Settings size={15} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
