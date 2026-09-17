import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crosshair, Search, ShieldAlert, CheckCircle2, AlertTriangle, Globe } from 'lucide-react';
import { iocsApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';

export default function ThreatIntel() {
  const [search, setSearch] = useState('');
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [isLookingUp, setIsLookingUp] = useState(false);

  const { data: iocs = [], isLoading } = useQuery({
    queryKey: ['threatIntelList', search],
    queryFn: async () => {
      const res = await iocsApi.getIOCs({ search: search || undefined });
      return res.data;
    }
  });

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;
    setIsLookingUp(true);
    try {
      const res = await iocsApi.lookup({ type: 'ip', value: lookupQuery.trim() });
      setLookupResult(res.data);
    } catch (err) {
      setLookupResult({ error: 'Indicator lookup failed' });
    } finally {
      setIsLookingUp(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Threat Intelligence & Reputation Feeds
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Global adversary indicators (IPs, Domains, Hashes, C2 URLs) correlated against enterprise telemetry.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Tracking <strong className="text-cyan-400 font-bold">{iocs.length}</strong> active indicators
        </div>
      </div>

      {/* Interactive IOC Reputation Lookup Tool */}
      <div className="p-5 bg-[#0b0f19] border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" /> Rapid Indicator Reputation Lookup
        </h4>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter IP (e.g. 194.26.29.112), Domain, or SHA256..."
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            className="flex-1 bg-[#070a10] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLookingUp}
            className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold disabled:opacity-50 transition-colors"
          >
            {isLookingUp ? 'Querying Feeds...' : 'Query Threat Intel'}
          </button>
        </form>

        {lookupResult && (
          <div className="mt-3 p-3.5 bg-[#070a10] rounded-lg border border-slate-800 text-xs">
            {lookupResult.threatIntel ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-rose-400">THREAT INTEL MATCH:</span>
                  <StatusBadge status={lookupResult.threatIntel.verdict} />
                  <span className="text-slate-400">Score: {lookupResult.threatIntel.score}/100</span>
                </div>
                <p className="text-slate-300">Feed Source: {lookupResult.threatIntel.source}</p>
                <div className="flex gap-1 pt-1">
                  {(lookupResult.threatIntel.tags || []).map((t, i) => (
                    <span key={i} className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> No known active threat feed detections for "{lookupResult.query?.value}".
              </p>
            )}
          </div>
        )}
      </div>

      {/* Indicators Table */}
      <div className="bg-[#0f1422] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter threat indicators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#070a10] border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-[#0b0f19] border-b border-slate-800 uppercase tracking-wider text-slate-400 text-[11px]">
              <tr>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Indicator Value</th>
                <th className="px-4 py-3 font-semibold">Reputation</th>
                <th className="px-4 py-3 font-semibold">Confidence</th>
                <th className="px-4 py-3 font-semibold">Occurrences</th>
                <th className="px-4 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Spinner size="md" />
                  </td>
                </tr>
              ) : iocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No threat indicators found.
                  </td>
                </tr>
              ) : (
                iocs.map((ioc) => (
                  <tr key={ioc._id} className="hover:bg-[#141b2d] transition-colors">
                    <td className="px-4 py-3 uppercase font-bold text-cyan-400">{ioc.type}</td>
                    <td className="px-4 py-3 font-semibold text-slate-200 select-all">{ioc.value}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ioc.reputation} />
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-200">{ioc.confidence}%</td>
                    <td className="px-4 py-3 text-slate-400">{ioc.count} hits</td>
                    <td className="px-4 py-3 text-slate-500 capitalize">{ioc.source}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
