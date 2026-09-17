import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileCode, Filter, RefreshCw, X } from 'lucide-react';
import EventTable from '../components/EventTable';
import { eventsApi } from '../services/api';

export default function Events() {
  const [source, setSource] = useState('');
  const [eventType, setEventType] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [host, setHost] = useState('');
  const [username, setUsername] = useState('');
  const [sourceIP, setSourceIP] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['eventsExplorer', { source, eventType, severity, status, host, username, sourceIP, page }],
    queryFn: async () => {
      const res = await eventsApi.getEvents({
        source: source || undefined,
        eventType: eventType || undefined,
        severity: severity || undefined,
        status: status || undefined,
        host: host || undefined,
        username: username || undefined,
        sourceIP: sourceIP || undefined,
        page,
        limit: 50
      });
      return res.data;
    }
  });

  const clearFilters = () => {
    setSource('');
    setEventType('');
    setSeverity('');
    setStatus('');
    setHost('');
    setUsername('');
    setSourceIP('');
    setPage(1);
  };

  const hasFilters = source || eventType || severity || status || host || username || sourceIP;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-4 bg-[#0f1422] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Common Event Model (CEM) Telemetry Explorer
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Normalized enterprise event stream with field filtering, MITRE technique tagging, and raw payload inspect.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Stream
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-[#0b0f19] border border-slate-800 rounded-xl space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-wider">
            <Filter className="w-4 h-4 text-cyan-400" /> Advanced Telemetry Filters
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Source filter */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Source</label>
            <select
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
              className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Sources</option>
              <option value="windows">Windows</option>
              <option value="linux">Linux</option>
              <option value="edr">EDR</option>
              <option value="network">Network</option>
              <option value="dns">DNS</option>
              <option value="firewall">Firewall</option>
              <option value="application">Application</option>
            </select>
          </div>

          {/* EventType filter */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Type</label>
            <select
              value={eventType}
              onChange={(e) => { setEventType(e.target.value); setPage(1); }}
              className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="authentication">Authentication</option>
              <option value="process">Process</option>
              <option value="file">File</option>
              <option value="network">Network</option>
              <option value="dns">DNS</option>
              <option value="registry">Registry</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Severity filter */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Severity</label>
            <select
              value={severity}
              onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
              className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:border-cyan-500 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="in_allowed_list">In Allowed List</option>
            </select>
          </div>

          {/* Host input */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Host</label>
            <input
              type="text"
              placeholder="e.g. DC01"
              value={host}
              onChange={(e) => { setHost(e.target.value); setPage(1); }}
              className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Username input */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">User</label>
            <input
              type="text"
              placeholder="e.g. jsmith"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setPage(1); }}
              className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Source IP input */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Source IP</label>
            <input
              type="text"
              placeholder="e.g. 194.26"
              value={sourceIP}
              onChange={(e) => { setSourceIP(e.target.value); setPage(1); }}
              className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Events Table */}
      <EventTable events={data?.events || []} isLoading={isLoading} />
    </div>
  );
}
