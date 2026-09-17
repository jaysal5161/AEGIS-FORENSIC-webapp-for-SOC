/**
 * iocExtractionService.js
 * Automatically extracts IOCs (IPs, Domains, URLs, Hashes, Emails) via regex from events.
 */

const IOC = require('../models/IOC');
const logger = require('../utils/logger');

// Regex patterns
const IPV4_REGEX = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
const URL_REGEX = /\bhttps?:\/\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]+/gi;
const DOMAIN_REGEX = /\b(?!(?:https?:\/\/))([a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.(?:com|org|net|io|ru|cn|cc|xyz|top|info|biz|me|live|pro|us|uk|de|gov|edu))\b/gi;
const MD5_REGEX = /\b[a-fA-F0-9]{32}\b/g;
const SHA1_REGEX = /\b[a-fA-F0-9]{40}\b/g;
const SHA256_REGEX = /\b[a-fA-F0-9]{64}\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

// Safe list for local/broadcast IPs to avoid noise
const LOCAL_IPS = ['0.0.0.0', '127.0.0.1', '255.255.255.255'];

async function extractAndStoreIOCs(events) {
  if (!events || events.length === 0) return 0;

  const iocMap = new Map(); // key -> { type, value, eventIds }

  for (const ev of events) {
    const textBlob = `${ev.description || ''} ${ev.sourceIP || ''} ${ev.destinationIP || ''} ${JSON.stringify(ev.raw || {})}`;
    const evId = ev._id;

    // Direct structured fields
    if (ev.sourceIP && !LOCAL_IPS.includes(ev.sourceIP)) {
      const key = `ip:${ev.sourceIP}`;
      if (!iocMap.has(key)) iocMap.set(key, { type: 'ip', value: ev.sourceIP, eventIds: new Set() });
      if (evId) iocMap.get(key).eventIds.add(evId);
    }
    if (ev.destinationIP && !LOCAL_IPS.includes(ev.destinationIP)) {
      const key = `ip:${ev.destinationIP}`;
      if (!iocMap.has(key)) iocMap.set(key, { type: 'ip', value: ev.destinationIP, eventIds: new Set() });
      if (evId) iocMap.get(key).eventIds.add(evId);
    }

    // URLs
    const urls = textBlob.match(URL_REGEX) || [];
    for (const url of urls) {
      const key = `url:${url}`;
      if (!iocMap.has(key)) iocMap.set(key, { type: 'url', value: url, eventIds: new Set() });
      if (evId) iocMap.get(key).eventIds.add(evId);
    }

    // Domains
    const domains = textBlob.match(DOMAIN_REGEX) || [];
    for (const domain of domains) {
      if (domain.includes('microsoft.com') || domain.includes('windows.com')) continue;
      const key = `domain:${domain.toLowerCase()}`;
      if (!iocMap.has(key)) iocMap.set(key, { type: 'domain', value: domain.toLowerCase(), eventIds: new Set() });
      if (evId) iocMap.get(key).eventIds.add(evId);
    }

    // Hashes
    const sha256s = textBlob.match(SHA256_REGEX) || [];
    for (const hash of sha256s) {
      const key = `hash:${hash.toLowerCase()}`;
      if (!iocMap.has(key)) iocMap.set(key, { type: 'hash', value: hash.toLowerCase(), eventIds: new Set() });
      if (evId) iocMap.get(key).eventIds.add(evId);
    }

    const sha1s = textBlob.match(SHA1_REGEX) || [];
    for (const hash of sha1s) {
      const key = `hash:${hash.toLowerCase()}`;
      if (!iocMap.has(key)) iocMap.set(key, { type: 'hash', value: hash.toLowerCase(), eventIds: new Set() });
      if (evId) iocMap.get(key).eventIds.add(evId);
    }

    const md5s = textBlob.match(MD5_REGEX) || [];
    for (const hash of md5s) {
      const key = `hash:${hash.toLowerCase()}`;
      if (!iocMap.has(key)) iocMap.set(key, { type: 'hash', value: hash.toLowerCase(), eventIds: new Set() });
      if (evId) iocMap.get(key).eventIds.add(evId);
    }

    // Emails
    const emails = textBlob.match(EMAIL_REGEX) || [];
    for (const email of emails) {
      const key = `email:${email.toLowerCase()}`;
      if (!iocMap.has(key)) iocMap.set(key, { type: 'email', value: email.toLowerCase(), eventIds: new Set() });
      if (evId) iocMap.get(key).eventIds.add(evId);
    }
  }

  let upsertedCount = 0;
  const now = new Date();

  for (const item of iocMap.values()) {
    try {
      const existing = await IOC.findOne({ type: item.type, value: item.value });
      const eventIdArray = Array.from(item.eventIds);

      if (existing) {
        existing.lastSeen = now;
        existing.count += eventIdArray.length || 1;
        for (const id of eventIdArray) {
          if (!existing.relatedEvents.includes(id)) {
            existing.relatedEvents.push(id);
          }
        }
        await existing.save();
      } else {
        await IOC.create({
          type: item.type,
          value: item.value,
          source: 'extracted',
          confidence: 75,
          reputation: 'unknown',
          firstSeen: now,
          lastSeen: now,
          count: eventIdArray.length || 1,
          relatedEvents: eventIdArray
        });
        upsertedCount++;
      }
    } catch (err) {
      logger.error(`Error upserting IOC ${item.type}:${item.value}: ${err.message}`);
    }
  }

  return upsertedCount;
}

module.exports = {
  extractAndStoreIOCs
};
