/**
 * attackChainService.js
 * Maps security events and techniques to the 10 core MITRE ATT&CK kill chain stages.
 */

const AttackChain = require('../models/AttackChain');

const MITRE_TECHNIQUE_MAP = {
  // Initial Access
  'T1190': { stage: 'InitialAccess', name: 'Exploit Public-Facing Application', sev: 'high' },
  'T1566': { stage: 'InitialAccess', name: 'Phishing', sev: 'high' },
  'T1078': { stage: 'InitialAccess', name: 'Valid Accounts', sev: 'medium' },
  'T1133': { stage: 'InitialAccess', name: 'External Remote Services', sev: 'medium' },

  // Execution
  'T1059': { stage: 'Execution', name: 'Command and Scripting Interpreter', sev: 'high' },
  'T1059.001': { stage: 'Execution', name: 'PowerShell Execution', sev: 'high' },
  'T1059.003': { stage: 'Execution', name: 'Windows Command Shell', sev: 'medium' },
  'T1204': { stage: 'Execution', name: 'User Execution', sev: 'medium' },

  // Persistence
  'T1547': { stage: 'Persistence', name: 'Boot or Logon Autostart Execution', sev: 'high' },
  'T1053': { stage: 'Persistence', name: 'Scheduled Task/Job', sev: 'high' },
  'T1136': { stage: 'Persistence', name: 'Create Account', sev: 'high' },

  // Privilege Escalation
  'T1068': { stage: 'PrivilegeEscalation', name: 'Exploitation for Privilege Escalation', sev: 'critical' },
  'T1548': { stage: 'PrivilegeEscalation', name: 'Abuse Elevation Control Mechanism', sev: 'high' },

  // Defense Evasion
  'T1070': { stage: 'DefenseEvasion', name: 'Indicator Removal on Host', sev: 'high' },
  'T1562': { stage: 'DefenseEvasion', name: 'Impair Defenses (Disable Antivirus/Logs)', sev: 'critical' },
  'T1027': { stage: 'DefenseEvasion', name: 'Obfuscated Files or Information', sev: 'medium' },

  // Credential Access
  'T1110': { stage: 'CredentialAccess', name: 'Brute Force / Password Spray', sev: 'high' },
  'T1003': { stage: 'CredentialAccess', name: 'OS Credential Dumping (LSASS/Mimikatz)', sev: 'critical' },
  'T1558': { stage: 'CredentialAccess', name: 'Steal or Forge Kerberos Tickets', sev: 'critical' },

  // Discovery
  'T1087': { stage: 'Discovery', name: 'Account Discovery', sev: 'low' },
  'T1082': { stage: 'Discovery', name: 'System Information Discovery', sev: 'low' },
  'T1046': { stage: 'Discovery', name: 'Network Service Scanning', sev: 'medium' },

  // Lateral Movement
  'T1021': { stage: 'LateralMovement', name: 'Remote Services (RDP/SSH/SMB)', sev: 'high' },
  'T1021.001': { stage: 'LateralMovement', name: 'Remote Desktop Protocol (RDP)', sev: 'high' },
  'T1021.002': { stage: 'LateralMovement', name: 'SMB/Windows Admin Shares', sev: 'high' },

  // Collection
  'T1560': { stage: 'Collection', name: 'Archive Collected Data (ZIP/RAR)', sev: 'medium' },
  'T1005': { stage: 'Collection', name: 'Data from Local System', sev: 'medium' },

  // Exfiltration
  'T1048': { stage: 'Exfiltration', name: 'Exfiltration Over Alternative Protocol', sev: 'critical' },
  'T1041': { stage: 'Exfiltration', name: 'Exfiltration Over C2 Channel', sev: 'critical' }
};

const STAGE_ORDER = [
  'InitialAccess',
  'Execution',
  'Persistence',
  'PrivilegeEscalation',
  'DefenseEvasion',
  'CredentialAccess',
  'Discovery',
  'LateralMovement',
  'Collection',
  'Exfiltration'
];

async function generateAttackChainForCase(caseId, events = []) {
  const stageBuckets = new Map(); // stage -> list of techniques

  for (const ev of events) {
    let tech = MITRE_TECHNIQUE_MAP[ev.techniqueId];
    if (!tech && ev.techniqueId) {
      // Find partial or prefix
      const prefix = ev.techniqueId.split('.')[0];
      tech = MITRE_TECHNIQUE_MAP[prefix];
    }

    if (!tech) {
      // Infer from text keywords
      const lower = `${ev.description} ${ev.action} ${ev.eventType}`.toLowerCase();
      if (lower.includes('brute') || lower.includes('failed password') || lower.includes('failed login')) {
        tech = MITRE_TECHNIQUE_MAP['T1110'];
      } else if (lower.includes('powershell')) {
        tech = MITRE_TECHNIQUE_MAP['T1059.001'];
      } else if (lower.includes('rdp') || lower.includes('port 3389')) {
        tech = MITRE_TECHNIQUE_MAP['T1021.001'];
      } else if (lower.includes('exfiltrat') || lower.includes('c2')) {
        tech = MITRE_TECHNIQUE_MAP['T1041'];
      }
    }

    if (tech) {
      const stageKey = tech.stage;
      if (!stageBuckets.has(stageKey)) {
        stageBuckets.set(stageKey, {
          stage: stageKey,
          techniqueId: ev.techniqueId || 'T1000',
          techniqueName: tech.name,
          severity: tech.sev || 'medium',
          description: `Observed on host ${ev.host || 'unknown'} by user ${ev.username || 'unknown'}: ${ev.description}`,
          eventHints: `Timestamp: ${ev.timestamp ? new Date(ev.timestamp).toISOString() : 'N/A'}`
        });
      }
    }
  }

  // Ensure stages are ordered according to standard kill chain
  const sortedStages = [];
  for (const stageName of STAGE_ORDER) {
    if (stageBuckets.has(stageName)) {
      sortedStages.push(stageBuckets.get(stageName));
    }
  }

  // If no stages found yet, provide a baseline initial access stage
  if (sortedStages.length === 0) {
    sortedStages.push({
      stage: 'InitialAccess',
      techniqueId: 'T1078',
      techniqueName: 'Valid Accounts / Anomalous Logon',
      severity: 'medium',
      description: 'Initial alert triggered by anomalous activity.',
      eventHints: 'Correlated from case entry alert.'
    });
  }

  let chain = await AttackChain.findOne({ caseId });
  if (!chain) {
    chain = await AttackChain.create({
      caseId,
      stages: sortedStages,
      confidence: sortedStages.length >= 3 ? 90 : 75,
      notes: `Automated attack chain constructed with ${sortedStages.length} verified MITRE ATT&CK stages.`
    });
  } else {
    chain.stages = sortedStages;
    chain.confidence = sortedStages.length >= 3 ? 90 : 75;
    await chain.save();
  }

  return chain;
}

module.exports = {
  generateAttackChainForCase,
  MITRE_TECHNIQUE_MAP,
  STAGE_ORDER
};
