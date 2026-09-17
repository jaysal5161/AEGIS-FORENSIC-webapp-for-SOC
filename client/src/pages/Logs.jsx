import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';
import LogUploader from '../components/LogUploader';
import EventTable from '../components/EventTable';
import { eventsApi } from '../services/api';

export default function Logs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['recentLogsEvents'],
    queryFn: async () => {
      const res = await eventsApi.getEvents({ limit: 15 });
      return res.data;
    }
  });

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['recentLogsEvents'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    refetch();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Security Log Ingestion & Normalization Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Ingest heterogeneous logs from Windows Event Logs, Syslog, EDR agents, and Network Firewalls.
            Parsed records are automatically normalized into the Common Event Model (CEM).
          </p>
        </div>

        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-semibold transition-colors"
        >
          Open Event Explorer <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Log Uploader Component */}
      <LogUploader onUploadSuccess={handleUploadSuccess} />

      {/* Recently Ingested Normalized Records */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Recently Ingested Common Event Model Telemetry
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Showing latest 15 records
          </span>
        </div>

        <EventTable events={data?.events || []} isLoading={isLoading} />
      </div>
    </div>
  );
}
