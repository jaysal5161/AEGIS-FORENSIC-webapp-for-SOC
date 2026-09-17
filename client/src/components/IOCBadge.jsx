import React, { useState } from 'react';
import { Copy, Check, Globe, HardDrive, Hash, Mail, Link as LinkIcon, ShieldAlert } from 'lucide-react';

export default function IOCBadge({ ioc, showScore = true, className = '' }) {
  const [copied, setCopied] = useState(false);

  const type = (ioc?.type || 'ip').toLowerCase();
  const rep = (ioc?.reputation || 'unknown').toLowerCase();
  const value = ioc?.value || '';

  const repStyles = {
    malicious: 'bg-rose-950/70 border-rose-600/70 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.25)]',
    suspicious: 'bg-amber-950/70 border-amber-600/70 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]',
    good: 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300',
    unknown: 'bg-slate-900 border-slate-700 text-slate-300'
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const renderIcon = () => {
    switch (type) {
      case 'ip': return <Globe className="w-3.5 h-3.5 mr-1" />;
      case 'domain': return <Globe className="w-3.5 h-3.5 mr-1 text-cyan-400" />;
      case 'url': return <LinkIcon className="w-3.5 h-3.5 mr-1 text-purple-400" />;
      case 'hash': return <Hash className="w-3.5 h-3.5 mr-1 text-amber-400" />;
      case 'email': return <Mail className="w-3.5 h-3.5 mr-1 text-sky-400" />;
      default: return <ShieldAlert className="w-3.5 h-3.5 mr-1" />;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${repStyles[rep] || repStyles.unknown} ${className}`}>
      <span className="flex items-center text-slate-400">
        {renderIcon()}
        <span className="uppercase text-[10px] tracking-wider mr-1.5 font-bold opacity-75">{type}:</span>
      </span>

      <span className="font-semibold tracking-tight truncate max-w-[240px]" title={value}>
        {value}
      </span>

      {showScore && ioc?.confidence !== undefined && (
        <span className="ml-1 text-[10px] px-1 py-0.2 rounded bg-black/40 font-mono text-slate-400">
          {ioc.confidence}%
        </span>
      )}

      <button
        onClick={handleCopy}
        className="ml-1 p-0.5 rounded text-slate-400 hover:text-white hover:bg-black/30 transition-colors"
        title="Copy IOC"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}
