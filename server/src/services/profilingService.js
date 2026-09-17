/**
 * profilingService.js
 * Updates Endpoint and Account asset profiles and risk scores from observed events.
 */

const Endpoint = require('../models/Endpoint');
const Account = require('../models/Account');
const logger = require('../utils/logger');

async function updateProfilesFromEvents(events) {
  if (!events || events.length === 0) return;

  const endpointMap = new Map(); // hostname -> { ips, users, ports, lastSeen, severities, failedCount }
  const accountMap = new Map();  // username -> { sourceIPs, endpoints, successCount, failedCount, lastSeen }

  for (const ev of events) {
    // 1. Process Endpoint
    if (ev.host) {
      const hostKey = ev.host.toUpperCase();
      if (!endpointMap.has(hostKey)) {
        endpointMap.set(hostKey, {
          hostname: ev.host,
          ips: new Set(),
          users: new Set(),
          ports: new Set(),
          lastSeen: ev.timestamp,
          failedCount: 0,
          hasCritical: false
        });
      }
      const epData = endpointMap.get(hostKey);
      if (ev.sourceIP) epData.ips.add(ev.sourceIP);
      if (ev.destinationIP) epData.ips.add(ev.destinationIP);
      if (ev.username && ev.username !== 'SYSTEM' && ev.username !== '-') epData.users.add(ev.username);
      if (ev.destinationPort) epData.ports.add(ev.destinationPort);
      if (ev.timestamp > epData.lastSeen) epData.lastSeen = ev.timestamp;
      if (ev.status === 'failed') epData.failedCount++;
      if (ev.severity === 'critical' || ev.severity === 'high') epData.hasCritical = true;
    }

    // 2. Process Account
    if (ev.username && ev.username !== 'SYSTEM' && ev.username !== '-' && ev.username !== '') {
      const userKey = ev.username.toLowerCase();
      if (!accountMap.has(userKey)) {
        accountMap.set(userKey, {
          username: ev.username,
          sourceIPs: new Set(),
          endpoints: new Set(),
          successCount: 0,
          failedCount: 0,
          lastSeen: ev.timestamp
        });
      }
      const accData = accountMap.get(userKey);
      if (ev.sourceIP) accData.sourceIPs.add(ev.sourceIP);
      if (ev.host) accData.endpoints.add(ev.host);
      if (ev.timestamp > accData.lastSeen) accData.lastSeen = ev.timestamp;
      if (ev.eventType === 'authentication') {
        if (ev.status === 'failed') accData.failedCount++;
        else if (ev.status === 'success') accData.successCount++;
      }
    }
  }

  // Update Endpoint documents
  for (const [hostKey, ep] of endpointMap.entries()) {
    try {
      let endpoint = await Endpoint.findOne({ hostname: new RegExp(`^${ep.hostname}$`, 'i') });
      if (!endpoint) {
        endpoint = new Endpoint({
          hostname: ep.hostname,
          os: ep.hostname.toLowerCase().startsWith('dc') || ep.hostname.toLowerCase().startsWith('srv')
            ? 'Windows Server 2022'
            : 'Windows 11 Pro',
          ipAddresses: Array.from(ep.ips),
          firstSeen: ep.lastSeen,
          lastSeen: ep.lastSeen,
          users: Array.from(ep.users),
          userCount: ep.users.size,
          openPorts: Array.from(ep.ports),
          riskScore: 10,
          status: 'clean'
        });
      } else {
        endpoint.lastSeen = ep.lastSeen > endpoint.lastSeen ? ep.lastSeen : endpoint.lastSeen;
        ep.ips.forEach(ip => { if (!endpoint.ipAddresses.includes(ip)) endpoint.ipAddresses.push(ip); });
        ep.users.forEach(u => { if (!endpoint.users.includes(u)) endpoint.users.push(u); });
        endpoint.userCount = endpoint.users.length;
        ep.ports.forEach(p => { if (!endpoint.openPorts.includes(p)) endpoint.openPorts.push(p); });
      }

      // Calculate risk score based on alerts, failed logins, critical severity
      let score = 10;
      score += Math.min(endpoint.associatedAlerts ? endpoint.associatedAlerts.length * 15 : 0, 45);
      score += Math.min(ep.failedCount * 5, 25);
      if (ep.hasCritical) score += 25;
      endpoint.riskScore = Math.min(Math.max(score, 5), 100);

      if (endpoint.riskScore >= 75) endpoint.status = 'compromised';
      else if (endpoint.riskScore >= 45) endpoint.status = 'suspicious';
      else endpoint.status = 'clean';

      await endpoint.save();
    } catch (err) {
      logger.error(`Error updating endpoint profile ${ep.hostname}: ${err.message}`);
    }
  }

  // Update Account documents
  for (const [userKey, acc] of accountMap.entries()) {
    try {
      let account = await Account.findOne({ username: new RegExp(`^${acc.username}$`, 'i') });
      if (!account) {
        account = new Account({
          username: acc.username,
          domain: 'CORP.LOCAL',
          privilege: acc.username.toLowerCase().includes('admin') ? 'admin' : 'standard',
          successLogins: acc.successCount,
          failedLogins: acc.failedCount,
          lastLogin: acc.successCount > 0 ? acc.lastSeen : null,
          sourceIPs: Array.from(acc.sourceIPs),
          endpoints: Array.from(acc.endpoints),
          riskScore: 10,
          status: 'clean'
        });
      } else {
        account.successLogins += acc.successCount;
        account.failedLogins += acc.failedCount;
        if (acc.successCount > 0) account.lastLogin = acc.lastSeen;
        acc.sourceIPs.forEach(ip => { if (!account.sourceIPs.includes(ip)) account.sourceIPs.push(ip); });
        acc.endpoints.forEach(e => { if (!account.endpoints.includes(e)) account.endpoints.push(e); });
      }

      // Calculate account risk
      let accScore = 10;
      if (account.failedLogins > 10) accScore += 35;
      else if (account.failedLogins > 3) accScore += 20;
      if (account.associatedAlerts && account.associatedAlerts.length > 0) {
        accScore += Math.min(account.associatedAlerts.length * 20, 40);
      }
      if (account.sourceIPs.length > 3) accScore += 15;
      account.riskScore = Math.min(Math.max(accScore, 5), 100);

      if (account.riskScore >= 75) account.status = 'compromised';
      else if (account.riskScore >= 45) account.status = 'suspicious';
      else account.status = 'clean';

      await account.save();
    } catch (err) {
      logger.error(`Error updating account profile ${acc.username}: ${err.message}`);
    }
  }
}

module.exports = {
  updateProfilesFromEvents
};
