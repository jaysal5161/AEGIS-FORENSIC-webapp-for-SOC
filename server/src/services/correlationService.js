/**
 * correlationService.js
 * Correlates and links entities (Identities -> Endpoints -> Network IPs -> Events).
 */

const Event = require('../models/Event');
const Endpoint = require('../models/Endpoint');
const Account = require('../models/Account');
const IOC = require('../models/IOC');

async function correlateAlertEntities(alert, windowHours = 4) {
  const queryOr = [];
  if (alert.sourceIP) queryOr.push({ sourceIP: alert.sourceIP });
  if (alert.host) queryOr.push({ host: alert.host });
  if (alert.username && alert.username !== 'SYSTEM' && alert.username !== '-') {
    queryOr.push({ username: alert.username });
  }

  if (queryOr.length === 0) return { events: [], endpoints: [], accounts: [], iocs: [] };

  const baseTime = alert.createdAt || new Date();
  const startTime = new Date(baseTime.getTime() - windowHours * 3600 * 1000);
  const endTime = new Date(baseTime.getTime() + windowHours * 3600 * 1000);

  // Find related events
  const events = await Event.find({
    $or: queryOr,
    timestamp: { $gte: startTime, $lte: endTime }
  }).sort({ timestamp: 1 }).limit(150);

  // Collect unique hosts, usernames, IPs
  const hosts = new Set();
  const users = new Set();
  const ips = new Set();

  if (alert.host) hosts.add(alert.host);
  if (alert.username && alert.username !== 'SYSTEM') users.add(alert.username);
  if (alert.sourceIP) ips.add(alert.sourceIP);

  events.forEach(e => {
    if (e.host) hosts.add(e.host);
    if (e.username && e.username !== 'SYSTEM' && e.username !== '-') users.add(e.username);
    if (e.sourceIP) ips.add(e.sourceIP);
    if (e.destinationIP) ips.add(e.destinationIP);
  });

  const endpoints = await Endpoint.find({
    hostname: { $in: Array.from(hosts).map(h => new RegExp(`^${h}$`, 'i')) }
  });

  const accounts = await Account.find({
    username: { $in: Array.from(users).map(u => new RegExp(`^${u}$`, 'i')) }
  });

  const iocs = await IOC.find({
    value: { $in: [...Array.from(ips), ...Array.from(hosts)] }
  });

  return {
    events,
    endpoints,
    accounts,
    iocs
  };
}

module.exports = {
  correlateAlertEntities
};
