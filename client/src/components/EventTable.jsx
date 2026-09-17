import React, { useState } from 'react';
import { format } from 'date-fns';
import { Eye, Terminal, Globe, Server, User, FileCode } from 'lucide-react';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';
import Modal from './Modal';
import DataTable from './DataTable';

export default function EventTable({ events = [], isLoading = false, onEventSelect }) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      sortable: true,
      headerClassName: 'w-44',
      cell: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.timestamp ? format(new Date(row.timestamp), 'yyyy-MM-dd HH:mm:ss') : '-'}
        </span>
      )
    },
    {
      header: 'Severity',
      accessor: 'severity',
      sortable: true,
      headerClassName: 'w-28',
      cell: (row) => <SeverityBadge severity={row.severity} />
    },
    {
      header: 'Source / Type',
      accessor: 'source',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-semibold text-cyan-400 capitalize">{row.source}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.eventType}</span>
        </div>
      )
    },
    {
      header: 'Host & Identity',
      accessor: 'host',
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-medium text-slate-200">{row.host}</span>
          <span className="text-[11px] text-slate-400 font-mono">{row.username || 'SYSTEM'}</span>
        </div>
      )
    },
    {
      header: 'Network Route',
      accessor: 'sourceIP',
      cell: (row) => (
        <div className="font-mono text-xs text-slate-300">
          {row.sourceIP ? (
            <span>
              {row.sourceIP}
              {row.destinationIP && <span className="text-slate-500 mx-1">&rarr;</span>}
              {row.destinationIP}
            </span>
          ) : (
            <span className="text-slate-500">-</span>
          )}
        </div>
      )
    },
    {
      header: 'Action / Status',
      accessor: 'action',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs uppercase text-slate-300">{row.action}</span>
          <StatusBadge status={row.status} />
        </div>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      cell: (row) => (
        <div className="max-w-md truncate" title={row.description}>
          <span className="text-xs text-slate-300">{row.description}</span>
          {row.techniqueId && (
            <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/50 text-[10px] font-mono">
              {row.techniqueId}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Inspect',
      accessor: '_id',
      className: 'text-right',
      cell: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(row);
            if (onEventSelect) onEventSelect(row);
          }}
          className="p-1 rounded bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-400 transition-colors"
          title="Inspect Event"
        >
          <Eye className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={events}
        isLoading={isLoading}
        searchPlaceholder="Filter events by description, host, IP, or technique..."
        onRowClick={(row) => setSelectedEvent(row)}
      />

      {/* Event Details Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Security Event Inspector"
        maxWidth="max-w-3xl"
      >
        {selectedEvent && (
          <div className="space-y-4">
            {/* Header Summary */}
            <div className="p-4 bg-[#0a0d14] rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={selectedEvent.severity} />
                  <span className="font-mono text-sm font-bold text-slate-200 uppercase">
                    {selectedEvent.action} ({selectedEvent.status})
                  </span>
                  {selectedEvent.techniqueId && (
                    <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300 text-xs font-mono font-bold">
                      MITRE {selectedEvent.techniqueId}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400 font-mono">
                  {selectedEvent.timestamp ? new Date(selectedEvent.timestamp).toUTCString() : 'N/A'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Event Source</span>
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase">{selectedEvent.source} // {selectedEvent.eventType}</span>
              </div>
            </div>

            {/* Structured Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#0b0f19] border border-slate-800">
                <span className="text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                  <Server className="w-3.5 h-3.5 text-cyan-400" /> Host Computer
                </span>
                <span className="text-slate-200 font-bold">{selectedEvent.host || '-'}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0b0f19] border border-slate-800">
                <span className="text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-emerald-400" /> Target Account
                </span>
                <span className="text-slate-200 font-bold">{selectedEvent.username || 'SYSTEM'}</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0b0f19] border border-slate-800">
                <span className="text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-amber-400" /> Source IP / Port
                </span>
                <span className="text-slate-200 font-bold">
                  {selectedEvent.sourceIP || '-'}{selectedEvent.sourcePort ? `:${selectedEvent.sourcePort}` : ''}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#0b0f19] border border-slate-800">
                <span className="text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                  <Globe className="w-3.5 h-3.5 text-rose-400" /> Destination IP / Port
                </span>
                <span className="text-slate-200 font-bold">
                  {selectedEvent.destinationIP || '-'}{selectedEvent.destinationPort ? `:${selectedEvent.destinationPort}` : ''}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-lg bg-[#0b0f19] border border-slate-800">
              <span className="text-slate-400 text-xs font-mono uppercase block mb-1">Event Narrative</span>
              <p className="text-sm text-slate-200 leading-relaxed font-mono">
                {selectedEvent.description}
              </p>
            </div>

            {/* Raw JSON / Log Payload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Raw Normalized Payload
                </span>
                {selectedEvent.rawFile && (
                  <span className="text-[11px] font-mono text-slate-500">
                    Source File: {selectedEvent.rawFile}
                  </span>
                )}
              </div>
              <pre className="p-3.5 bg-[#070a10] border border-slate-800/90 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto max-h-60 leading-relaxed">
                {JSON.stringify(selectedEvent.raw || selectedEvent, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
