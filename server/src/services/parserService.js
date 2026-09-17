/**
 * parserService.js
 * Automatically parses raw log contents from CSV, JSON, TXT/LOG formats.
 */

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^["']|["']$/g, '').trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
    const record = {};
    headers.forEach((header, idx) => {
      let val = values[idx] !== undefined ? values[idx] : '';
      val = val.replace(/^["']|["']$/g, '').trim();
      record[header] = val;
    });
    record._rawLine = lines[i];
    records.push(record);
  }

  return records;
}

function parseJSON(content) {
  const trimmed = content.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return JSON.parse(trimmed);
  }
  // Try line-delimited JSON
  const lines = trimmed.split(/\r?\n/).filter(l => l.trim().length > 0);
  const records = [];
  for (const line of lines) {
    try {
      records.push(JSON.parse(line));
    } catch (e) {
      // ignore bad lines in line-delimited JSON
    }
  }
  if (records.length > 0) return records;

  // Single JSON object
  const single = JSON.parse(trimmed);
  return Array.isArray(single) ? single : [single];
}

function parseTxtOrLog(content) {
  const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
  const records = [];

  for (const line of lines) {
    const record = { _rawLine: line };

    // 1. Check for key=value tokens (e.g., src=192.168.1.1 dst=10.0.0.5 user=admin proto=tcp)
    const kvMatches = [...line.matchAll(/([a-zA-Z0-9_\-\.]+)=["']?([^"'\s]+)["']?/g)];
    if (kvMatches.length > 0) {
      for (const match of kvMatches) {
        record[match[1]] = match[2];
      }
    }

    // 2. Syslog pattern: "Mmm dd hh:mm:ss host process[pid]: message"
    const syslogMatch = line.match(/^([A-Z][a-z]{2}\s+\d+\s+\d{2}:\d{2}:\d{2})\s+([^\s]+)\s+([^:\[]+)(?:\[(\d+)\])?:\s+(.*)$/);
    if (syslogMatch) {
      record.syslogTime = syslogMatch[1];
      record.host = record.host || syslogMatch[2];
      record.process = syslogMatch[3];
      record.pid = syslogMatch[4];
      record.message = syslogMatch[5];
    }

    // 3. Failed sshd logins: "Failed password for (invalid user )?(\w+) from ([\d\.]+) port (\d+)"
    const sshdFailed = line.match(/Failed password for (?:invalid user )?([^\s]+) from ([0-9\.]+) port (\d+)/i);
    if (sshdFailed) {
      record.username = sshdFailed[1];
      record.sourceIP = sshdFailed[2];
      record.sourcePort = sshdFailed[3];
      record.action = 'login';
      record.status = 'failed';
      record.eventType = 'authentication';
    }

    // 4. Accepted sshd logins: "Accepted password for (\w+) from ([\d\.]+) port (\d+)"
    const sshdAccepted = line.match(/Accepted (?:password|publickey) for ([^\s]+) from ([0-9\.]+) port (\d+)/i);
    if (sshdAccepted) {
      record.username = sshdAccepted[1];
      record.sourceIP = sshdAccepted[2];
      record.sourcePort = sshdAccepted[3];
      record.action = 'login';
      record.status = 'success';
      record.eventType = 'authentication';
    }

    // 5. Windows Event Log style hints
    if (line.includes('4625') || line.toLowerCase().includes('logon failure') || line.toLowerCase().includes('failed login')) {
      record.eventType = 'authentication';
      record.action = 'login';
      record.status = 'failed';
      record.source = 'windows';
    } else if (line.includes('4624') || line.toLowerCase().includes('successful logon')) {
      record.eventType = 'authentication';
      record.action = 'login';
      record.status = 'success';
      record.source = 'windows';
    } else if (line.includes('4688') || line.toLowerCase().includes('process creation') || line.toLowerCase().includes('powershell')) {
      record.eventType = 'process';
      record.action = 'execute';
      record.source = 'windows';
    }

    records.push(record);
  }

  return records;
}

function parseFile(fileName, content) {
  const ext = (fileName || '').split('.').pop().toLowerCase();
  const trimmed = content.trim();

  try {
    if (ext === 'json' || trimmed.startsWith('[') || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
      return parseJSON(trimmed);
    }
  } catch (e) {
    // fallback to text parser if JSON fails
  }

  if (ext === 'csv' || (!ext && trimmed.split('\n')[0].includes(','))) {
    try {
      const csvResults = parseCSV(trimmed);
      if (csvResults.length > 0) return csvResults;
    } catch (e) {
      // fallback
    }
  }

  return parseTxtOrLog(trimmed);
}

module.exports = {
  parseFile,
  parseCSV,
  parseJSON,
  parseTxtOrLog
};
