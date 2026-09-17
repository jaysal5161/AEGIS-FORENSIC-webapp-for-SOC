import React from 'react';
import { ShieldAlert, ArrowDown, CheckCircle2, CircleDashed, ExternalLink, Edit3 } from 'lucide-react';
import SeverityBadge from './SeverityBadge';

const ALL_MITRE_STAGES = [
  { id: 'InitialAccess', name: 'Initial Access', description: 'Techniques used to gain an initial foothold into network.' },
  { id: 'Execution', name: 'Execution', description: 'Techniques resulting in adversary-controlled code running on host.' },
  { id: 'Persistence', name: 'Persistence', description: 'Techniques used to keep access across restarts or changed credentials.' },
  { id: 'PrivilegeEscalation', name: 'Privilege Escalation', description: 'Techniques used to gain higher-level permissions (SYSTEM/Root).' },
  { id: 'DefenseEvasion', name: 'Defense Evasion', description: 'Techniques used to avoid detection by security controls.' },
  { id: 'CredentialAccess', name: 'Credential Access', description: 'Techniques for stealing credentials like passwords and hashes.' },
  { id: 'Discovery', name: 'Discovery', description: 'Techniques used to observe the system and internal network topology.' },
  { id: 'LateralMovement', name: 'Lateral Movement', description: 'Techniques used to enter and control remote systems on network.' },
  { id: 'Collection', name: 'Collection', description: 'Techniques used to gather data of interest for exfiltration.' },
  { id: 'Exfiltration', name: 'Exfiltration', description: 'Techniques used to steal and route data out of the environment.' }
];

export default function AttackGraph({ attackChain, onEditStage }) {
  const presentStages = attackChain?.stages || [];
  const stageMap = new Map();
  presentStages.forEach((s) => {
    stageMap.set(s.stage, s);
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-4 bg-[#0f1422] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold font-mono tracking-wide text-slate-200 uppercase">
            MITRE ATT&CK &bull; Forensic Kill Chain Reconstruction
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated correlation across {presentStages.length} detected adversary stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Confidence Score: <strong className="text-cyan-400">{attackChain?.confidence || 80}%</strong>
          </span>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Detected ({presentStages.length})
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <CircleDashed className="w-3.5 h-3.5" /> Inactive ({ALL_MITRE_STAGES.length - presentStages.length})
            </span>
          </div>
        </div>
      </div>

      {/* Kill Chain Flowchart */}
      <div className="max-w-3xl mx-auto space-y-3 py-4">
        {ALL_MITRE_STAGES.map((stageDef, idx) => {
          const match = stageMap.get(stageDef.id);
          const isPresent = !!match;

          return (
            <React.Fragment key={stageDef.id}>
              <div
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isPresent
                    ? 'bg-[#141b2d] border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                    : 'bg-[#0f1422]/60 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 p-2 rounded-lg ${
                      isPresent ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'
                    }`}>
                      {isPresent ? <CheckCircle2 className="w-5 h-5" /> : <CircleDashed className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          STAGE {idx + 1}
                        </span>
                        <h5 className="text-sm font-bold font-mono text-slate-100">
                          {stageDef.name}
                        </h5>

                        {isPresent && match.severity && (
                          <SeverityBadge severity={match.severity} />
                        )}

                        {isPresent && match.techniqueId && (
                          <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 font-mono text-xs font-bold flex items-center gap-1">
                            {match.techniqueId}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1">
                        {isPresent ? (match.techniqueName || stageDef.description) : stageDef.description}
                      </p>

                      {isPresent && match.description && (
                        <div className="mt-2 p-2.5 rounded bg-[#0b0f19] border border-slate-800/80 text-xs font-mono text-slate-300">
                          <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Forensic Telemetry Observation:</span>
                          {match.description}
                        </div>
                      )}

                      {isPresent && match.eventHints && (
                        <span className="inline-block mt-1.5 text-[11px] font-mono text-slate-500">
                          Ref: {match.eventHints}
                        </span>
                      )}
                    </div>
                  </div>

                  {isPresent && onEditStage && (
                    <button
                      onClick={() => onEditStage(match)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-colors"
                      title="Edit Stage Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Arrow Connector */}
              {idx < ALL_MITRE_STAGES.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown className={`w-4 h-4 ${
                    isPresent && stageMap.has(ALL_MITRE_STAGES[idx + 1].id)
                      ? 'text-cyan-400 animate-pulse'
                      : 'text-slate-700'
                  }`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
