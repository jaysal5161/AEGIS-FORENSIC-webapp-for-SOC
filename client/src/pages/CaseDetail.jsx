import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Briefcase,
  Clock,
  FileCode,
  Crosshair,
  Users,
  Server,
  Network,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Edit,
  Save,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  UploadCloud,
  FileDown,
  Printer,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

import {
  casesApi,
  timelineApi,
  attackChainApi,
  impactApi,
  reviewApi,
  reportsApi,
  iocsApi
} from '../services/api';

import SeverityBadge from '../components/SeverityBadge';
import StatusBadge from '../components/StatusBadge';
import Timeline from '../components/Timeline';
import EventTable from '../components/EventTable';
import IOCBadge from '../components/IOCBadge';
import AttackGraph from '../components/AttackGraph';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useAuthStore } from '../stores/authStore';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAnalyst } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [addAnnotationModal, setAddAnnotationModal] = useState(false);
  const [annotationData, setAnnotationData] = useState({ title: '', category: 'system', description: '', severity: 'medium' });
  const [addIocModal, setAddIocModal] = useState(false);
  const [iocData, setIocData] = useState({ type: 'ip', value: '', reputation: 'suspicious', notes: '' });
  const [uploadEvidenceModal, setUploadEvidenceModal] = useState(false);
  const [evidenceData, setEvidenceData] = useState({ title: '', type: 'log', description: '', hashType: 'SHA256', hashValue: '' });
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [editStageModal, setEditStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);
  const [reviewError, setReviewError] = useState(null);

  // Fetch Case Data
  const { data: caseItem, isLoading } = useQuery({
    queryKey: ['caseDetail', id],
    queryFn: async () => {
      const res = await casesApi.getCaseById(id);
      return res.data;
    }
  });

  // Fetch Timeline
  const { data: timelineEntries = [], refetch: refetchTimeline } = useQuery({
    queryKey: ['caseTimeline', id],
    queryFn: async () => {
      const res = await timelineApi.getTimeline(id);
      return res.data;
    }
  });

  // Fetch Attack Chain
  const { data: attackChain, refetch: refetchAttackChain } = useQuery({
    queryKey: ['caseAttackChain', id],
    queryFn: async () => {
      const res = await attackChainApi.getAttackChain(id);
      return res.data;
    }
  });

  // Fetch Impact Assessment
  const { data: impact, refetch: refetchImpact } = useQuery({
    queryKey: ['caseImpact', id],
    queryFn: async () => {
      const res = await impactApi.getImpact(id);
      return res.data;
    }
  });

  // Fetch Evidence
  const { data: evidenceList = [], refetch: refetchEvidence } = useQuery({
    queryKey: ['caseEvidence', id],
    queryFn: async () => {
      const res = await casesApi.getEvidence(id);
      return res.data;
    }
  });

  // Fetch Report
  const { data: report, refetch: refetchReport } = useQuery({
    queryKey: ['caseReport', id],
    queryFn: async () => {
      try {
        const res = await reportsApi.getReport(id);
        return res.data;
      } catch (err) {
        return null;
      }
    }
  });

  // Update Case Mutation
  const updateCaseMutation = useMutation({
    mutationFn: (updateData) => casesApi.updateCase(id, updateData),
    onSuccess: () => {
      setReviewError(null);
      queryClient.invalidateQueries({ queryKey: ['caseDetail', id] });
    },
    onError: (err) => {
      setReviewError(err.response?.data?.message || 'Update failed');
    }
  });

  // Add Timeline Entry Mutation
  const addTimelineMutation = useMutation({
    mutationFn: (entry) => timelineApi.addEntry(id, entry),
    onSuccess: () => {
      refetchTimeline();
      setAddAnnotationModal(false);
      setAnnotationData({ title: '', category: 'system', description: '', severity: 'medium' });
    }
  });

  // Add IOC Mutation
  const addIocMutation = useMutation({
    mutationFn: (newIoc) => iocsApi.createIOC({ ...newIoc, caseId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseDetail', id] });
      setAddIocModal(false);
      setIocData({ type: 'ip', value: '', reputation: 'suspicious', notes: '' });
    }
  });

  // Upload Evidence Mutation
  const uploadEvidenceMutation = useMutation({
    mutationFn: (formData) => casesApi.addEvidence(id, formData),
    onSuccess: () => {
      refetchEvidence();
      queryClient.invalidateQueries({ queryKey: ['caseDetail', id] });
      setUploadEvidenceModal(false);
      setEvidenceFile(null);
    }
  });

  // Validate Evidence Mutation
  const validateEvidenceMutation = useMutation({
    mutationFn: ({ evidenceId, validated }) => casesApi.validateEvidence(id, evidenceId, { analystValidated: validated }),
    onSuccess: () => refetchEvidence()
  });

  // Save Review Mutation
  const [reviewFindings, setReviewFindings] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [valFlags, setValFlags] = useState({ evidence: false, timeline: false, iocs: false });

  React.useEffect(() => {
    if (caseItem?.review) {
      setReviewFindings(caseItem.review.findings || '');
      setReviewNotes(caseItem.review.notes || '');
      setValFlags(caseItem.review.validatedFlags || { evidence: false, timeline: false, iocs: false });
    }
  }, [caseItem]);

  const saveReviewMutation = useMutation({
    mutationFn: (reviewData) => reviewApi.saveReview(id, reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caseDetail', id] });
      alert('Forensic review findings saved successfully!');
    }
  });

  // Generate Report Mutation
  const generateReportMutation = useMutation({
    mutationFn: () => reportsApi.generateReport(id),
    onSuccess: () => refetchReport()
  });

  // Update Impact Mutation
  const [impactForm, setImpactForm] = useState({
    dataExposed: false,
    malwareDetected: '',
    businessImpact: '',
    analystNotes: '',
    confidence: 80
  });

  React.useEffect(() => {
    if (impact) {
      setImpactForm({
        dataExposed: Boolean(impact.dataExposed),
        malwareDetected: impact.malwareDetected || '',
        businessImpact: impact.businessImpact || '',
        analystNotes: impact.analystNotes || '',
        confidence: impact.confidence || 80
      });
    }
  }, [impact]);

  const updateImpactMutation = useMutation({
    mutationFn: (data) => impactApi.updateImpact(id, data),
    onSuccess: () => {
      refetchImpact();
      alert('Impact assessment updated!');
    }
  });

  const handleExport = async (formatType = 'md') => {
    try {
      const res = await reportsApi.exportReport(id, formatType);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${caseItem.caseId}-report.${formatType}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export report');
    }
  };

  const handleStatusChange = (newStatus) => {
    updateCaseMutation.mutate({ status: newStatus });
  };

  const handlePhaseChange = (newPhase) => {
    updateCaseMutation.mutate({ phase: newPhase });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
        <p className="mt-3 text-xs font-mono text-slate-400">Loading Forensic Dossier...</p>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400 font-mono">Case not found.</p>
        <button onClick={() => navigate('/cases')} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded">
          Back to Cases
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: timelineEntries.length },
    { id: 'events', label: 'Events', icon: FileCode, count: caseItem.relatedEvents?.length },
    { id: 'iocs', label: 'IOCs', icon: Crosshair, count: caseItem.iocs?.length },
    { id: 'accounts', label: 'Accounts', icon: Users, count: caseItem.accounts?.length },
    { id: 'endpoints', label: 'Endpoints', icon: Server, count: caseItem.endpoints?.length },
    { id: 'attack_chain', label: 'Attack Chain', icon: Network, count: attackChain?.stages?.length },
    { id: 'evidence', label: 'Evidence Locker', icon: ShieldCheck, count: evidenceList.length },
    { id: 'impact', label: 'Damage Assessment', icon: AlertOctagon },
    { id: 'review', label: 'Analyst Review', icon: Edit },
    { id: 'report', label: 'Final Report', icon: FileText }
  ];

  const phases = ['ingestion', 'analysis', 'investigation', 'forensics', 'impact', 'review', 'closed'];

  return (
    <div className="space-y-6 pb-12">
      {/* Case Header Banner */}
      <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-mono font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
              {caseItem.caseId}
            </span>
            <SeverityBadge severity={caseItem.priority} />
            <StatusBadge status={caseItem.status} />
          </div>

          {/* Quick Lifecycle Controls */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-mono text-slate-500 uppercase">Phase:</label>
            <select
              value={caseItem.phase}
              onChange={(e) => handlePhaseChange(e.target.value)}
              className="bg-[#0b0f19] border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-cyan-300 focus:border-cyan-500 focus:outline-none capitalize"
            >
              {phases.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <label className="text-xs font-mono text-slate-500 uppercase ml-2">Status:</label>
            <select
              value={caseItem.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-[#0b0f19] border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none capitalize"
            >
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="pending_review">Pending Review</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold font-mono text-white tracking-tight">
            {caseItem.title}
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-sans leading-relaxed max-w-4xl">
            {caseItem.description}
          </p>
        </div>

        {reviewError && (
          <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{reviewError}</span>
          </div>
        )}

        {/* Phase Stepper Bar */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1">
            {phases.map((ph, idx) => {
              const curIdx = phases.indexOf(caseItem.phase);
              const isPast = idx < curIdx;
              const isCurrent = idx === curIdx;
              return (
                <div
                  key={ph}
                  onClick={() => handlePhaseChange(ph)}
                  className={`flex-1 py-1 px-1 rounded text-center cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500 font-bold'
                      : isPast
                      ? 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      : 'bg-[#0b0f19] text-slate-600'
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider block truncate">
                    {idx + 1}. {ph}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl text-xs font-mono transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-[#0f1422] font-bold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-cyan-950 text-cyan-300 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#0f1422] border border-slate-800 rounded-xl space-y-2">
              <span className="text-slate-500 text-[10px] font-mono uppercase">Primary Assigned Analyst</span>
              <p className="text-sm font-bold font-mono text-slate-200">
                {caseItem.assignedTo?.fullName || caseItem.assignedTo?.username || 'Unassigned'}
              </p>
              <span className="text-xs text-slate-400 font-mono">{caseItem.assignedTo?.email || 'N/A'}</span>
            </div>

            <div className="p-4 bg-[#0f1422] border border-slate-800 rounded-xl space-y-2">
              <span className="text-slate-500 text-[10px] font-mono uppercase">Originating Trigger Alert</span>
              <p className="text-sm font-bold font-mono text-cyan-400 truncate">
                {caseItem.alertId?.title || 'Direct Analyst Scaffold'}
              </p>
              <span className="text-xs text-slate-400 font-mono">
                {caseItem.alertId?.alertId || 'Manual Initiation'}
              </span>
            </div>

            <div className="p-4 bg-[#0f1422] border border-slate-800 rounded-xl space-y-2">
              <span className="text-slate-500 text-[10px] font-mono uppercase">Forensic Artifact Stats</span>
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 pt-1">
                <span>{caseItem.relatedEvents?.length || 0} Events</span>
                <span>&bull;</span>
                <span>{caseItem.iocs?.length || 0} IOCs</span>
                <span>&bull;</span>
                <span>{caseItem.endpoints?.length || 0} Hosts</span>
                <span>&bull;</span>
                <span>{evidenceList.length} Evidence</span>
              </div>
            </div>
          </div>

          {/* Incident Scope Description */}
          <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Investigation Narrative & Scope
            </h4>
            <p className="text-sm text-slate-300 font-mono leading-relaxed bg-[#0b0f19] p-4 rounded-lg border border-slate-800/80">
              {caseItem.description}
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Timeline */}
      {activeTab === 'timeline' && (
        <Timeline
          entries={timelineEntries}
          onAddEntry={() => setAddAnnotationModal(true)}
        />
      )}

      {/* Tab 3: Events */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Events Correlated into Dossier ({caseItem.relatedEvents?.length || 0})
            </h4>
          </div>
          <EventTable events={caseItem.relatedEvents || []} />
        </div>
      )}

      {/* Tab 4: IOCs */}
      {activeTab === 'iocs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Extracted & Linked Indicators of Compromise
            </h4>
            <button
              onClick={() => setAddIocModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold"
            >
              <Plus className="w-4 h-4" /> Add Manual IOC
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {caseItem.iocs?.map((ioc) => (
              <div key={ioc._id} className="p-3 bg-[#0f1422] border border-slate-800 rounded-xl flex items-center justify-between">
                <IOCBadge ioc={ioc} />
                <span className="text-[10px] font-mono text-slate-500">{ioc.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Accounts */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Compromised & Involved Account Identities
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseItem.accounts?.map((acc) => (
              <div key={acc._id} className="p-4 bg-[#0f1422] border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-200">{acc.username}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400">{acc.privilege}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono block mt-1">
                    Domain: {acc.domain} &bull; {acc.failedLogins || 0} failed logins
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono font-bold block ${acc.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    Risk: {acc.riskScore}/100
                  </span>
                  <StatusBadge status={acc.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Endpoints */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Targeted & Compromised Host Assets
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseItem.endpoints?.map((ep) => (
              <div key={ep._id} className="p-4 bg-[#0f1422] border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-mono text-sm font-bold text-slate-200 block">{ep.hostname}</span>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">{ep.os}</span>
                  <span className="text-[11px] text-cyan-400 font-mono mt-1 block">
                    IPs: {ep.ipAddresses?.join(', ') || 'N/A'}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-mono font-bold block ${ep.riskScore > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    Risk: {ep.riskScore}/100
                  </span>
                  <StatusBadge status={ep.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 7: Attack Chain */}
      {activeTab === 'attack_chain' && (
        <AttackGraph
          attackChain={attackChain}
          onEditStage={(stage) => {
            setSelectedStage(stage);
            setEditStageModal(true);
          }}
        />
      )}

      {/* Tab 8: Evidence Locker */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Digital Evidence Locker & Chain of Custody
            </h4>
            <button
              onClick={() => setUploadEvidenceModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold"
            >
              <UploadCloud className="w-4 h-4" /> Upload Evidence Artifact
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 bg-[#0f1422] border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
            {evidenceList.length === 0 ? (
              <p className="p-8 text-center text-slate-500">No evidence artifacts secured in locker yet.</p>
            ) : (
              evidenceList.map((ev) => (
                <div key={ev._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#141b2d] transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[10px] uppercase font-bold">
                        {ev.type}
                      </span>
                      <strong className="text-slate-200 text-sm">{ev.title}</strong>
                    </div>
                    <p className="text-xs text-slate-400 font-sans mt-1">{ev.description}</p>
                    <div className="mt-2 text-[11px] text-slate-500">
                      <span>Hash [{ev.hashType}]: </span>
                      <code className="text-slate-300 bg-[#0b0f19] px-1.5 py-0.5 rounded">{ev.hashValue}</code>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => validateEvidenceMutation.mutate({ evidenceId: ev._id, validated: !ev.analystValidated })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        ev.analystValidated
                          ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {ev.analystValidated ? '✓ Validated by Analyst' : 'Validate Artifact'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 9: Damage / Impact Assessment */}
      {activeTab === 'impact' && (
        <div className="space-y-6">
          <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-xl space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Automated Forensic Indicators & Telemetry
            </h4>
            <div className="p-3.5 bg-[#0b0f19] rounded-lg border border-slate-800/80 space-y-1.5 text-xs font-mono text-slate-300">
              {(impact?.autoDetectedIndicators || []).map((ind, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>{ind}</span>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200 pt-2">
              Analyst Damage & Breach Assessment Form
            </h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateImpactMutation.mutate(impactForm);
              }}
              className="space-y-4 font-mono text-xs"
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dataExposed"
                  checked={impactForm.dataExposed}
                  onChange={(e) => setImpactForm({ ...impactForm, dataExposed: e.target.checked })}
                  className="rounded bg-[#070a10] border-slate-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="dataExposed" className="text-slate-200 font-bold uppercase">
                  Data Breach / Confidential Asset Exfiltration Confirmed
                </label>
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Identified Malware / Tooling</label>
                <input
                  type="text"
                  value={impactForm.malwareDetected}
                  onChange={(e) => setImpactForm({ ...impactForm, malwareDetected: e.target.value })}
                  className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Business & Operational Impact</label>
                <textarea
                  rows={2}
                  value={impactForm.businessImpact}
                  onChange={(e) => setImpactForm({ ...impactForm, businessImpact: e.target.value })}
                  className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-sans text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase mb-1">Analyst Assessment Notes</label>
                <textarea
                  rows={3}
                  value={impactForm.analystNotes}
                  onChange={(e) => setImpactForm({ ...impactForm, analystNotes: e.target.value })}
                  className="w-full bg-[#070a10] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-sans text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateImpactMutation.isPending}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono shadow-[0_0_10px_rgba(6,182,212,0.3)] disabled:opacity-50"
                >
                  Save Damage Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 10: Analyst Review & Sign-Off */}
      {activeTab === 'review' && (
        <div className="p-5 bg-[#0f1422] border border-slate-800 rounded-xl space-y-4">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Forensic Analyst Review Checklist & Sign-Off
          </h4>

          <div className="p-4 bg-[#0b0f19] rounded-lg border border-slate-800 space-y-2.5 font-mono text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={valFlags.evidence}
                onChange={(e) => setValFlags({ ...valFlags, evidence: e.target.checked })}
                className="rounded bg-[#070a10] border-slate-800 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-200">All evidence artifacts validated & hash integrity verified</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={valFlags.timeline}
                onChange={(e) => setValFlags({ ...valFlags, timeline: e.target.checked })}
                className="rounded bg-[#070a10] border-slate-800 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-200">Forensic incident timeline chronologically verified</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={valFlags.iocs}
                onChange={(e) => setValFlags({ ...valFlags, iocs: e.target.checked })}
                className="rounded bg-[#070a10] border-slate-800 text-cyan-500 focus:ring-0"
              />
              <span className="text-slate-200">Indicators of compromise confirmed and reputation triaged</span>
            </label>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Detailed Findings & Threat Actor Profile</label>
              <textarea
                rows={4}
                required
                value={reviewFindings}
                onChange={(e) => setReviewFindings(e.target.value)}
                placeholder="Document conclusive findings..."
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-sans text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase mb-1">Internal Analyst Notes</label>
              <textarea
                rows={2}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Operational handover notes..."
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-sans text-xs"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => saveReviewMutation.mutate({ findings: reviewFindings, notes: reviewNotes, validatedFlags: valFlags })}
                disabled={saveReviewMutation.isPending}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Review Findings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 11: Incident Report */}
      {activeTab === 'report' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Forensic Incident Dossier Report
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => generateReportMutation.mutate()}
                disabled={generateReportMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                {generateReportMutation.isPending ? 'Generating...' : 'Compile / Re-generate Report'}
              </button>
              {report && (
                <>
                  <button
                    onClick={() => handleExport('md')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download Markdown
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" /> HTML Print View
                  </button>
                </>
              )}
            </div>
          </div>

          {report ? (
            <div className="p-6 bg-[#0f1422] border border-slate-800 rounded-xl space-y-6 font-mono text-xs">
              <div className="pb-4 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-cyan-400 font-bold text-sm block">{report.title}</span>
                  <span className="text-slate-400">Report No: {report.reportNumber}</span>
                </div>
                <SeverityBadge severity={report.severity} />
              </div>

              <div>
                <h5 className="text-xs uppercase text-slate-400 font-bold mb-1">1. Incident Summary</h5>
                <p className="p-3 bg-[#0b0f19] rounded border border-slate-800/80 text-slate-200 font-sans leading-relaxed">
                  {report.sections?.incidentSummary}
                </p>
              </div>

              <div>
                <h5 className="text-xs uppercase text-slate-400 font-bold mb-1">2. Strategic Recommendations</h5>
                <ul className="space-y-1 p-3 bg-[#0b0f19] rounded border border-slate-800/80 text-slate-300 list-disc list-inside">
                  {(report.sections?.recommendations || []).map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#0f1422] border border-slate-800 rounded-xl">
              <FileText className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
              <p className="text-sm font-mono text-slate-300">Incident report not yet compiled.</p>
              <button
                onClick={() => generateReportMutation.mutate()}
                className="mt-3 px-4 py-2 bg-cyan-500 text-black font-mono font-bold text-xs rounded-lg"
              >
                Compile Report Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Timeline Annotation Modal */}
      <Modal
        isOpen={addAnnotationModal}
        onClose={() => setAddAnnotationModal(false)}
        title="Add Timeline Annotation"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTimelineMutation.mutate(annotationData);
          }}
          className="space-y-3 font-mono text-xs"
        >
          <div>
            <label className="block text-slate-400 uppercase mb-1">Title</label>
            <input
              type="text"
              required
              value={annotationData.title}
              onChange={(e) => setAnnotationData({ ...annotationData, title: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Category</label>
              <select
                value={annotationData.category}
                onChange={(e) => setAnnotationData({ ...annotationData, category: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                <option value="system">System</option>
                <option value="authentication">Authentication</option>
                <option value="network">Network</option>
                <option value="process">Process</option>
                <option value="file">File</option>
                <option value="dns">DNS</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 uppercase mb-1">Severity</label>
              <select
                value={annotationData.severity}
                onChange={(e) => setAnnotationData({ ...annotationData, severity: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-400 uppercase mb-1">Description</label>
            <textarea
              required
              rows={3}
              value={annotationData.description}
              onChange={(e) => setAnnotationData({ ...annotationData, description: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-sans text-xs"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAddAnnotationModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-cyan-500 text-black font-bold rounded">
              Save Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Manual IOC Modal */}
      <Modal
        isOpen={addIocModal}
        onClose={() => setAddIocModal(false)}
        title="Add Manual IOC to Dossier"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addIocMutation.mutate(iocData);
          }}
          className="space-y-3 font-mono text-xs"
        >
          <div>
            <label className="block text-slate-400 uppercase mb-1">IOC Type</label>
            <select
              value={iocData.type}
              onChange={(e) => setIocData({ ...iocData, type: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="ip">IPv4 Address</option>
              <option value="domain">Domain Name</option>
              <option value="url">URL</option>
              <option value="hash">File Hash (SHA256/MD5)</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 uppercase mb-1">Indicator Value</label>
            <input
              type="text"
              required
              value={iocData.value}
              onChange={(e) => setIocData({ ...iocData, value: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-400 uppercase mb-1">Reputation Verdict</label>
            <select
              value={iocData.reputation}
              onChange={(e) => setIocData({ ...iocData, reputation: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="malicious">Malicious</option>
              <option value="suspicious">Suspicious</option>
              <option value="good">Good / Benign</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setAddIocModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-cyan-500 text-black font-bold rounded">
              Add IOC
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Evidence Modal */}
      <Modal
        isOpen={uploadEvidenceModal}
        onClose={() => setUploadEvidenceModal(false)}
        title="Upload Forensic Artifact"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData();
            formData.append('title', evidenceData.title);
            formData.append('type', evidenceData.type);
            formData.append('description', evidenceData.description);
            formData.append('hashType', evidenceData.hashType);
            formData.append('hashValue', evidenceData.hashValue);
            if (evidenceFile) formData.append('file', evidenceFile);
            uploadEvidenceMutation.mutate(formData);
          }}
          className="space-y-3 font-mono text-xs"
        >
          <div>
            <label className="block text-slate-400 uppercase mb-1">Artifact Title</label>
            <input
              type="text"
              required
              value={evidenceData.title}
              onChange={(e) => setEvidenceData({ ...evidenceData, title: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>
          <div>
            <label className="block text-slate-400 uppercase mb-1">Artifact Type</label>
            <select
              value={evidenceData.type}
              onChange={(e) => setEvidenceData({ ...evidenceData, type: e.target.value })}
              className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              <option value="artifact">Memory / Binary Artifact</option>
              <option value="pcap">Network PCAP</option>
              <option value="log">Log Extract</option>
              <option value="screenshot">Forensic Screenshot</option>
              <option value="file">File Extract</option>
            </select>
          </div>
          <div>
            <label className="block text-slate-400 uppercase mb-1">Select File (Optional)</label>
            <input
              type="file"
              onChange={(e) => setEvidenceFile(e.target.files[0])}
              className="w-full text-slate-400 file:bg-slate-800 file:text-slate-200 file:border-0 file:rounded file:px-2 file:py-1"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-400 uppercase mb-1">Hash Algorithm</label>
              <select
                value={evidenceData.hashType}
                onChange={(e) => setEvidenceData({ ...evidenceData, hashType: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                <option value="SHA256">SHA256</option>
                <option value="SHA1">SHA1</option>
                <option value="MD5">MD5</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 uppercase mb-1">Hash Value</label>
              <input
                type="text"
                placeholder="Checksum..."
                value={evidenceData.hashValue}
                onChange={(e) => setEvidenceData({ ...evidenceData, hashValue: e.target.value })}
                className="w-full bg-[#080b12] border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setUploadEvidenceModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded">
              Cancel
            </button>
            <button type="submit" className="px-4 py-1.5 bg-cyan-500 text-black font-bold rounded">
              Secure Artifact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
