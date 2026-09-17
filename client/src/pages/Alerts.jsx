import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Filter, Search, ShieldAlert, FolderPlus, ArrowRight } from 'lucide-react';
import { alertsApi } from '../services/api';
import AlertCard from '../components/AlertCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';

export default function Alerts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [search, setSearch] = useState('');

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['alerts', { status, severity, search }],
    queryFn: async () => {
      const res = await alertsApi.getAlerts({
        status: status || undefined,
        severity: severity || undefined,
        search: search || undefined
      });
      return res.data;
    }
  });

  const createCaseMutation = useMutation({
    mutationFn: (alertId) => alertsApi.createCase(alertId, {}),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      const newCase = res.data.case;
      if (newCase) {
        navigate(`/cases/${newCase._id}`);
      }
    }
  });

  const handleCreateCase = (alert) => {
    createCaseMutation.mutate(alert._id);
  };

  const handleInvestigate = (alert) => {
    if (alert.caseId) {
      navigate(`/cases/${alert.caseId._id || alert.caseId}`);
    } else {
      createCaseMutation.mutate(alert._id);
    }
  };

  const statuses = [
    { label: 'All Statuses', value: '' },
    { label: 'New', value: 'new' },
    { label: 'Investigating', value: 'investigating' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'Resolved', value: 'resolved' },
    { label: 'Dismissed', value: 'dismissed' }
  ];

  const severities = [
    { label: 'All Severities', value: '' },
    { label: 'Critical', value: 'critical' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Security Alerts & Threat Triage Queue
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Real-time correlated detection alerts. Convert triage findings into full forensic investigative cases with a single click.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Queue Volume: <strong className="text-cyan-400 font-bold">{alerts.length}</strong> alerts
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-[#0b0f19] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search alert title, host, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#070a10] border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-[#070a10] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="bg-[#070a10] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            {severities.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Spinner size="md" />
          <p className="mt-2 text-xs font-mono text-slate-400">Loading alerts triage queue...</p>
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          title="No alerts found"
          description="All clear! No security alerts match your current filter parameters."
          icon={ShieldAlert}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <AlertCard
              key={alert._id}
              alert={alert}
              onCreateCase={handleCreateCase}
              onInvestigate={handleInvestigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
