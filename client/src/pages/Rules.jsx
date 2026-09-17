import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sliders, Plus, Play, Trash2, CheckCircle2, ShieldAlert, Edit2 } from 'lucide-react';
import { rulesApi } from '../services/api';
import SeverityBadge from '../components/SeverityBadge';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useAuthStore } from '../stores/authStore';

export default function Rules() {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [engineResult, setEngineResult] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    severity: 'high',
    enabled: true,
    eventType: 'authentication',
    action: 'login',
    status: 'failed',
    threshold: 3,
    windowSeconds: 300,
    mitreTechniqueId: 'T1110',
    tags: 'BruteForce, Auth'
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['detectionRules'],
    queryFn: async () => {
      const res = await rulesApi.getRules();
      return res.data;
    }
  });

  // Toggle Rule
  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }) => rulesApi.updateRule(id, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['detectionRules'] })
  });

  // Delete Rule
  const deleteMutation = useMutation({
    mutationFn: (id) => rulesApi.deleteRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['detectionRules'] })
  });

  // Create Rule
  const createMutation = useMutation({
    mutationFn: (newRule) => rulesApi.createRule(newRule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['detectionRules'] });
      setCreateModalOpen(false);
    }
  });

  const handleRunEngine = async () => {
    setExecuting(true);
    setEngineResult(null);
    try {
      const res = await rulesApi.runAll();
      setEngineResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardSummary'] });
    } catch (err) {
      alert('Failed to execute detection engine');
    } finally {
      setExecuting(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      severity: formData.severity,
      enabled: formData.enabled,
      condition: {
        eventType: formData.eventType,
        action: formData.action,
        status: formData.status,
        threshold: parseInt(formData.threshold, 10) || 1,
        windowSeconds: parseInt(formData.windowSeconds, 10) || 300,
        patternType: 'threshold'
      },
      mitreTechniqueId: formData.mitreTechniqueId,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wide">
              Detection Engine & SIEM Correlation Rules
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Configurable threshold and sequence correlation rules aligned with the MITRE ATT&CK framework.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunEngine}
            disabled={executing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-mono text-xs font-bold transition-all border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] disabled:opacity-50"
          >
            {executing ? <Spinner size="sm" /> : <Play className="w-4 h-4" />}
            {executing ? 'Evaluating...' : 'Run Detection Engine'}
          </button>

          {isAdmin() && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-mono text-xs font-bold hover:brightness-110 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
            >
              <Plus className="w-4 h-4" /> Create Rule
            </button>
          )}
        </div>
      </div>

      {/* Engine Execution Result Banner */}
      {engineResult && (
        <div className="p-4 rounded-xl bg-[#0f1422] border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.2)] flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>{engineResult.message} &bull; Generated <strong className="text-white">{engineResult.alertsGenerated}</strong> new alerts!</span>
          </div>
          <button onClick={() => setEngineResult(null)} className="text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Rules Grid */}
      {isLoading ? (
        <div className="py-12 text-center">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div
              key={rule._id}
              className={`p-5 rounded-xl border bg-[#0f1422] transition-all flex flex-col justify-between ${
                rule.enabled
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/40 opacity-60 bg-[#0b0f19]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={rule.severity} />
                    {rule.mitreTechniqueId && (
                      <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-800 text-purple-300 font-mono text-xs font-bold">
                        {rule.mitreTechniqueId}
                      </span>
                    )}
                  </div>

                  {/* Enable/Disable Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => toggleMutation.mutate({ id: rule._id, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>

                <h4 className="text-sm font-bold font-mono text-slate-100 mb-1">
                  {rule.name}
                </h4>
                <p className="text-xs text-slate-400 font-sans leading-relaxed mb-4">
                  {rule.description}
                </p>

                {/* Condition Metadata */}
                <div className="p-2.5 rounded-lg bg-[#0b0f19] border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span>Threshold Condition:</span>
                    <strong className="text-slate-200">
                      &ge; {rule.condition?.threshold || 1} hits within {rule.condition?.windowSeconds || 300}s
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Event Match:</span>
                    <strong className="text-cyan-400">
                      {rule.condition?.eventType || 'any'} &bull; {rule.condition?.action || 'any'} ({rule.condition?.status || 'any'})
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs font-mono">
                <div className="flex flex-wrap gap-1">
                  {(rule.tags || []).map((t, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-400">
                      #{t}
                    </span>
                  ))}
                </div>

                {isAdmin() && (
                  <button
                    onClick={() => {
                      if (confirm(`Delete rule "${rule.name}"?`)) {
                        deleteMutation.mutate(rule._id);
                      }
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Detection Rule"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-slate-400 uppercase mb-1">Rule Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Mass Password Guessing"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Description</label>
            <textarea
              required
              rows={2}
              placeholder="Explain detection logic..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none font-sans text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">MITRE Technique ID</label>
              <input
                type="text"
                placeholder="e.g. T1110"
                value={formData.mitreTechniqueId}
                onChange={(e) => setFormData({ ...formData, mitreTechniqueId: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Event Type</label>
              <input
                type="text"
                placeholder="e.g. authentication"
                value={formData.eventType}
                onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Action</label>
              <input
                type="text"
                placeholder="e.g. login"
                value={formData.action}
                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Status</label>
              <input
                type="text"
                placeholder="e.g. failed"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Threshold (Count)</label>
              <input
                type="number"
                min="1"
                value={formData.threshold}
                onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Window (Seconds)</label>
              <input
                type="number"
                min="10"
                value={formData.windowSeconds}
                onChange={(e) => setFormData({ ...formData, windowSeconds: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 uppercase mb-1">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="CredentialAccess, Windows"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
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
              {createMutation.isPending ? 'Saving...' : 'Deploy Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
