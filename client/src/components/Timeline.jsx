import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Key,
  Network,
  Cpu,
  FileText,
  Globe,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  Filter
} from 'lucide-react';
import SeverityBadge from './SeverityBadge';

export default function Timeline({ entries = [], onAddEntry }) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getCategoryConfig = (cat) => {
    switch ((cat || '').toLowerCase()) {
      case 'authentication':
        return { icon: Key, color: 'text-emerald-400', dot: 'bg-emerald-500 border-emerald-300' };
      case 'network':
        return { icon: Network, color: 'text-cyan-400', dot: 'bg-cyan-500 border-cyan-300' };
      case 'process':
        return { icon: Cpu, color: 'text-amber-400', dot: 'bg-amber-500 border-amber-300' };
      case 'file':
        return { icon: FileText, color: 'text-purple-400', dot: 'bg-purple-500 border-purple-300' };
      case 'dns':
        return { icon: Globe, color: 'text-sky-400', dot: 'bg-sky-500 border-sky-300' };
      default:
        return { icon: Shield, color: 'text-slate-400', dot: 'bg-slate-500 border-slate-300' };
    }
  };

  const filteredEntries = React.useMemo(() => {
    if (filterCategory === 'all') return entries;
    return entries.filter((e) => e.category === filterCategory);
  }, [entries, filterCategory]);

  const categories = ['all', 'authentication', 'network', 'process', 'file', 'dns', 'system'];

  return (
    <div className="space-y-6">
      {/* Timeline Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#0f1422] border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <Filter className="w-4 h-4 text-slate-500 mr-1 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono capitalize transition-colors ${
                filterCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {onAddEntry && (
          <button
            onClick={onAddEntry}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors"
          >
            + Add Annotation
          </button>
        )}
      </div>

      {/* Vertical Timeline Track */}
      {filteredEntries.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-mono text-sm">
          No timeline records found for category "{filterCategory}".
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-4 md:ml-6 space-y-6 py-2">
          {filteredEntries.map((item, idx) => {
            const config = getCategoryConfig(item.category);
            const Icon = config.icon;
            const isExpanded = expandedIds.has(item._id || idx);

            return (
              <div key={item._id || idx} className="relative pl-6 md:pl-8 group">
                {/* Node dot on the vertical line */}
                <div
                  className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${config.dot} shadow-[0_0_8px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-125`}
                />

                {/* Timeline Card */}
                <div
                  onClick={() => toggleExpand(item._id || idx)}
                  className="p-4 bg-[#0f1422] border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-[#141b2d] cursor-pointer transition-all shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                        {item.category}
                      </span>
                      <SeverityBadge severity={item.severity} />
                      {item.attackStage && (
                        <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 text-[10px] font-mono">
                          {item.attackStage}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {item.timestamp ? format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm:ss') : '-'}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </div>

                  <h5 className="text-sm font-bold font-mono text-slate-100 mb-1">
                    {item.title}
                  </h5>

                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    {item.description}
                  </p>

                  {/* Expandable Context Drawer */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-slate-400">
                      <div>Host: <strong className="text-slate-200">{item.host || 'N/A'}</strong></div>
                      <div>User: <strong className="text-slate-200">{item.username || 'N/A'}</strong></div>
                      <div>Source IP: <strong className="text-slate-200">{item.sourceIP || 'N/A'}</strong></div>
                      <div>Reference: <strong className="text-cyan-400">{item.ref || 'N/A'}</strong></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
