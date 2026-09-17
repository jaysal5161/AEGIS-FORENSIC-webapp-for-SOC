/**
 * normalizationService.js
 * Normalizes disparate parsed event objects into the Common Event Model (CEM).
 */

const VALID_SOURCES = ['windows', 'linux', 'network', 'dns', 'firewall', 'application', 'cloud', 'edr'];
const VALID_EVENT_TYPES = ['authentication', 'process', 'file', 'network', 'dns', 'registry', 'other'];
const VALID_ACTIONS = ['login', 'logout', 'create', 'delete', 'execute', 'connect', 'failed', 'success', 'modify'];
const VALID_STATUSES = ['success', 'failed', 'in_allowed_list'];
const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

function parseTimestamp(rawTs) {
  if (!rawTs) return new Date();
  const d = new Date(rawTs);
  if (!isNaN(d.getTime())) return d;
  return new Date();
}

function normalizeRecord(raw, fileName = '') {
  // Field fallback mapping
  const timestamp = parseTimestamp(
    raw.timestamp || raw.Time || raw.time || raw.datetime || raw.date || raw['@timestamp'] || raw.EventTime
  );

  let source = (raw.source || raw.src_type || raw.log_source || 'windows').toLowerCase();
  if (!VALID_SOURCES.includes(source)) {
    if (source.includes('win')) source = 'windows';
    else if (source.includes('lin') || source.includes('syslog') || source.includes('auth')) source = 'linux';
    else if (source.includes('net') || source.includes('pcap')) source = 'network';
    else if (source.includes('dns')) source = 'dns';
    else if (source.includes('fire') || source.includes('fw')) source = 'firewall';
    else if (source.includes('edr') || source.includes('crowd') || source.includes('sentinel')) source = 'edr';
    else if (source.includes('cloud') || source.includes('aws') || source.includes('azure')) source = 'cloud';
    else source = 'windows';
  }

  const host = (
    raw.host || raw.hostname || raw.ComputerName || raw.computer || raw.dhost || raw.device_name || 'DC01'
  ).toString().trim();

  const username = (
    raw.username || raw.user || raw.TargetUserName || raw.account || raw.user_name || raw.suser || 'SYSTEM'
  ).toString().trim();

  const sourceIP = (
    raw.sourceIP || raw.src_ip || raw.src || raw.srcip || raw.source_ip || raw.IpAddress || raw.client_ip || ''
  ).toString().trim();

  const destinationIP = (
    raw.destinationIP || raw.dst_ip || raw.dst || raw.dstip || raw.dest_ip || raw.server_ip || ''
  ).toString().trim();

  const sourcePort = parseInt(raw.sourcePort || raw.src_port || raw.srcport || raw.spt || 0, 10) || null;
  const destinationPort = parseInt(raw.destinationPort || raw.dst_port || raw.dstport || raw.dpt || 0, 10) || null;

  let eventType = (raw.eventType || raw.event_type || raw.category || raw.type || '').toLowerCase();
  if (!VALID_EVENT_TYPES.includes(eventType)) {
    if (eventType.includes('auth') || eventType.includes('logon')) eventType = 'authentication';
    else if (eventType.includes('proc') || eventType.includes('exec')) eventType = 'process';
    else if (eventType.includes('file')) eventType = 'file';
    else if (eventType.includes('net') || eventType.includes('conn')) eventType = 'network';
    else if (eventType.includes('dns') || eventType.includes('domain')) eventType = 'dns';
    else if (eventType.includes('reg')) eventType = 'registry';
    else eventType = 'other';
  }

  let action = (raw.action || raw.act || raw.command || '').toLowerCase();
  if (!VALID_ACTIONS.includes(action)) {
    if (action.includes('login') || action.includes('logon')) action = 'login';
    else if (action.includes('logout') || action.includes('logoff')) action = 'logout';
    else if (action.includes('exec') || action.includes('spawn') || action.includes('run')) action = 'execute';
    else if (action.includes('creat')) action = 'create';
    else if (action.includes('del')) action = 'delete';
    else if (action.includes('conn')) action = 'connect';
    else if (action.includes('fail')) action = 'failed';
    else if (action.includes('succ')) action = 'success';
    else if (action.includes('mod')) action = 'modify';
    else action = eventType === 'authentication' ? 'login' : 'execute';
  }

  let status = (raw.status || raw.result || raw.outcome || '').toLowerCase();
  if (!VALID_STATUSES.includes(status)) {
    if (status.includes('fail') || status.includes('den') || status.includes('err') || action === 'failed') {
      status = 'failed';
    } else if (status.includes('allow') || status.includes('permit') || status.includes('white')) {
      status = 'in_allowed_list';
    } else {
      status = 'success';
    }
  }

  let severity = (raw.severity || raw.level || raw.priority || '').toLowerCase();
  if (!VALID_SEVERITIES.includes(severity)) {
    if (severity.includes('crit') || severity.includes('fatal')) severity = 'critical';
    else if (severity.includes('high') || severity.includes('warn') || status === 'failed') severity = 'high';
    else if (severity.includes('med')) severity = 'medium';
    else severity = 'low';
  }

  const techniqueId = (raw.techniqueId || raw.technique || raw.mitre || raw.mitreTechniqueId || '').toString().trim();

  let description = raw.description || raw.message || raw.msg || raw.EventData || raw._rawLine || '';
  if (!description) {
    description = `${eventType.toUpperCase()} event on ${host} by ${username} (${action} ${status})`;
  }

  // Tags collection
  const tags = Array.isArray(raw.tags) ? [...raw.tags] : [];
  if (techniqueId && !tags.includes(techniqueId)) tags.push(techniqueId);
  if (source && !tags.includes(source)) tags.push(source);
  if (eventType && !tags.includes(eventType)) tags.push(eventType);

  return {
    timestamp,
    source,
    host,
    username,
    sourceIP,
    destinationIP,
    sourcePort,
    destinationPort,
    eventType,
    action,
    status,
    severity,
    raw,
    rawFile: fileName,
    techniqueId,
    description,
    tags
  };
}

function normalizeRecords(rawRecords, fileName = '') {
  return rawRecords.map(r => normalizeRecord(r, fileName));
}

module.exports = {
  normalizeRecord,
  normalizeRecords
};
