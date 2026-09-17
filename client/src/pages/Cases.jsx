import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Briefcase, Plus, Search, FolderLock, User, ShieldAlert, ArrowRight } from 'lucide-react';
import { casesApi } from '../services/api';
import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { useAuthStore } from '../stores/authStore';

export default function Cases() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAnalyst } = useAuthStore();
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'high',
    phase: 'ingestion'
  });

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['cases', { status, priority, search }],
    queryFn: async () => {
      const res = await casesApi.getCases({
        status: status || undefined,
        priority: priority || undefined,
        search: search || undefined
      });
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: (newCase) => casesApi.createCase(newCase),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setCreateModalOpen(false);
      navigate(`/cases/${res.data._id}`);
    }
  });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const phases = ['ingestion', 'analysis', 'investigation', 'forensics', 'impact', 'review', 'closed'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Forensic Incident Cases & Investigations
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Active forensic dossiers navigating the 7-phase incident lifecycle from ingestion to final closure.
          </p>
        </div>

        {isAnalyst() && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-mono text-xs font-bold hover:brightness-110 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
          >
            <Plus className="w-4 h-4" /> Open New Case
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-[#0b0f19] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search case ID, title..."
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
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="pending_review">Pending Review</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-[#070a10] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Cases List */}
      {isLoading ? (
        <div className="py-16 text-center">
          <Spinner size="md" />
          <p className="mt-2 text-xs font-mono text-slate-400">Loading cases...</p>
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          title="No cases found"
          description="There are currently no forensic cases matching your filter criteria."
          icon={FolderLock}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cases.map((c) => (
            <div
              key={c._id}
              onClick={() => navigate(`/cases/${c._id}`)}
              className="p-5 rounded-xl border border-slate-800 bg-[#0f1422] hover:border-cyan-500/60 hover:bg-[#141b2d] cursor-pointer transition-all shadow-lg flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      {c.caseId}
                    </span>
                    <SeverityBadge severity={c.priority} />
                    <StatusBadge status={c.status} />
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {c.updatedAt ? format(new Date(c.updatedAt), 'yyyy-MM-dd HH:mm') : ''}
                  </span>
                </div>

                <h3 className="text-base font-bold font-mono text-slate-100 mb-1.5 group-hover:text-cyan-300 transition-colors">
                  {c.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {c.description}
                </p>

                {/* Phase Stepper Pills */}
                <div className="p-2 bg-[#0a0d14] rounded-lg border border-slate-800/80 mb-4">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-slate-500 uppercase">
                    <span>Incident Phase:</span>
                    <strong className="text-cyan-400 uppercase font-bold">{c.phase}</strong>
                  </div>
                  <div className="flex items-center gap-1">
                    {phases.map((ph, idx) => {
                      const currentIdx = phases.indexOf(c.phase);
                      const isDone = idx <= currentIdx;
                      return (
                        <div
                          key={ph}
                          className={`h-1.5 flex-1 rounded-full ${
                            isDone ? 'bg-cyan-500' : 'bg-slate-800'
                          }`}
                          title={`Phase ${idx + 1}: ${ph}`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Analyst: <strong className="text-slate-200">{c.assignedTo?.fullName || c.assignedTo?.username || 'Unassigned'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-cyan-400 font-bold group-hover:translate-x-1 transition-transform">
                  <span>Enter Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Case Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Scaffold Forensic Case"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 uppercase mb-1">Case Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Unauthorized Lateral Access Investigation"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Case Description</label>
            <textarea
              required
              rows={3}
              placeholder="Brief summary of incident scope, target hosts, and preliminary observations..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none font-sans text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Initial Phase</label>
              <select
                value={formData.phase}
                onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="ingestion">Ingestion</option>
                <option value="analysis">Analysis</option>
                <option value="investigation">Investigation</option>
                <option value="forensics">Forensics</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono shadow-[0_0_10px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              {createMutation.isPending ? 'Scaffolding...' : 'Create Case'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
